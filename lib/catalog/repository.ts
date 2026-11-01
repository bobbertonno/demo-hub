import 'server-only'
import type { Filter } from 'mongodb'
import { isDatabaseConfigured } from '@/lib/config/env'
import { COLLECTIONS, getCollection, sanitizeDbError } from '@/lib/db/mongo'
import { DemoInput, DemoRecord, type DemoStatus, type SyncState } from '@/lib/schemas/manifest'
import { seedDemos } from '@/lib/seed/demos'
import { seedCapabilities, type CapabilityDefinition } from '@/lib/seed/capabilities'
import type { DocumentationSnapshot } from '@/lib/github/types'

export type CatalogMode = 'database' | 'seed'

export class ReadOnlyCatalogError extends Error {
  status = 503
  constructor() {
    super('The catalog is in read-only seed mode. Configure MONGODB_URI to enable writes.')
    this.name = 'ReadOnlyCatalogError'
  }
}

export class NotFoundError extends Error {
  status = 404
}
export class ConflictError extends Error {
  status = 409
}

export function getCatalogMode(): CatalogMode {
  return isDatabaseConfigured() ? 'database' : 'seed'
}

function assertWritable() {
  if (getCatalogMode() === 'seed') throw new ReadOnlyCatalogError()
}

type DemoDoc = DemoRecord & { _id?: unknown }

function strip<T extends { _id?: unknown }>(doc: T): Omit<T, '_id'> {
  const { _id, ...rest } = doc
  void _id
  return rest
}

export type CatalogReadResult<T> = { data: T; mode: CatalogMode; degraded?: string }

export async function listDemos(opts: { includeArchived?: boolean } = {}): Promise<CatalogReadResult<DemoRecord[]>> {
  if (getCatalogMode() === 'seed') {
    return { data: seedDemos.filter((d) => opts.includeArchived || d.status !== 'archived'), mode: 'seed' }
  }
  try {
    const col = await getCollection<DemoDoc>(COLLECTIONS.demos)
    const filter: Filter<DemoDoc> = opts.includeArchived ? {} : { status: { $ne: 'archived' } }
    const docs = await col.find(filter).sort({ featured: -1, title: 1 }).limit(500).toArray()
    return { data: docs.map((d) => strip(d) as DemoRecord), mode: 'database' }
  } catch (err) {
    return {
      data: [],
      mode: 'database',
      degraded: err instanceof Error ? sanitizeDbError(err.message) : 'Database unavailable',
    }
  }
}

export async function getDemoBySlug(slug: string): Promise<DemoRecord | null> {
  if (getCatalogMode() === 'seed') return seedDemos.find((d) => d.slug === slug) ?? null
  const col = await getCollection<DemoDoc>(COLLECTIONS.demos)
  const doc = await col.findOne({ slug })
  return doc ? (strip(doc) as DemoRecord) : null
}

export async function createDemo(input: unknown): Promise<DemoRecord> {
  assertWritable()
  const parsed = DemoInput.parse(input)
  const now = new Date().toISOString()
  const record: DemoRecord = DemoRecord.parse({
    ...parsed,
    sync: { status: parsed.repository ? 'never' : 'not-configured', lastAttemptAt: null, lastSuccessAt: null, lastError: null, commitSha: null, ref: null },
    createdAt: now,
    updatedAt: now,
  })
  const col = await getCollection<DemoDoc>(COLLECTIONS.demos)
  try {
    await col.insertOne({ ...record })
  } catch (err) {
    if (isDuplicateKey(err)) throw new ConflictError('A demo with this slug, id or repository already exists.')
    throw err
  }
  return record
}

export async function updateDemo(slug: string, input: unknown): Promise<{ before: DemoRecord; after: DemoRecord }> {
  assertWritable()
  const parsed = DemoInput.parse(input)
  const col = await getCollection<DemoDoc>(COLLECTIONS.demos)
  const existing = await col.findOne({ slug })
  if (!existing) throw new NotFoundError(`Demo "${slug}" not found`)
  const before = strip(existing) as DemoRecord
  const after: DemoRecord = DemoRecord.parse({
    ...parsed,
    sync: before.repository !== parsed.repository ? { ...before.sync, status: parsed.repository ? 'never' : 'not-configured', commitSha: null } : before.sync,
    createdAt: before.createdAt,
    updatedAt: new Date().toISOString(),
  })
  try {
    await col.replaceOne({ slug }, after)
  } catch (err) {
    if (isDuplicateKey(err)) throw new ConflictError('Another demo already uses this slug, id or repository.')
    throw err
  }
  return { before, after }
}

export async function setDemoStatus(slug: string, status: DemoStatus): Promise<DemoRecord> {
  assertWritable()
  const col = await getCollection<DemoDoc>(COLLECTIONS.demos)
  const res = await col.findOneAndUpdate({ slug }, { $set: { status, updatedAt: new Date().toISOString() } }, { returnDocument: 'after' })
  if (!res) throw new NotFoundError(`Demo "${slug}" not found`)
  return strip(res) as DemoRecord
}

export async function deleteDemo(slug: string): Promise<DemoRecord> {
  assertWritable()
  const col = await getCollection<DemoDoc>(COLLECTIONS.demos)
  const res = await col.findOneAndDelete({ slug })
  if (!res) throw new NotFoundError(`Demo "${slug}" not found`)
  return strip(res) as DemoRecord
}

export async function updateSyncState(slug: string, sync: Partial<SyncState>, extra: Partial<DemoRecord> = {}): Promise<void> {
  assertWritable()
  const col = await getCollection<DemoDoc>(COLLECTIONS.demos)
  const set: Record<string, unknown> = { ...extra }
  for (const [k, v] of Object.entries(sync)) set[`sync.${k}`] = v
  await col.updateOne({ slug }, { $set: set })
}

export async function listCapabilities(): Promise<CapabilityDefinition[]> {
  if (getCatalogMode() === 'seed') return seedCapabilities
  try {
    const col = await getCollection<CapabilityDefinition & { _id?: unknown }>(COLLECTIONS.capabilities)
    const docs = await col.find({}).toArray()
    if (docs.length === 0) return seedCapabilities
    const order = new Map(seedCapabilities.map((c, i) => [c.id, i]))
    return docs.map((d) => strip(d) as CapabilityDefinition).sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99))
  } catch {
    return seedCapabilities
  }
}

export async function getLatestSnapshot(slug: string): Promise<DocumentationSnapshot | null> {
  if (getCatalogMode() === 'seed') return null
  try {
    const col = await getCollection<DocumentationSnapshot & { _id?: unknown }>(COLLECTIONS.documentationSnapshots)
    const doc = await col.find({ demoSlug: slug, status: 'ok' }).sort({ fetchedAt: -1 }).limit(1).next()
    return doc ? (strip(doc) as DocumentationSnapshot) : null
  } catch {
    return null
  }
}

function isDuplicateKey(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 11000
}
