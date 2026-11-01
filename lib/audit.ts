import 'server-only'
import { randomUUID } from 'node:crypto'
import { isDatabaseConfigured } from '@/lib/config/env'
import { COLLECTIONS, getCollection } from '@/lib/db/mongo'

export type AuditEntry = {
  id: string
  at: string
  actorEmail: string
  actorRole: string
  action: string
  target: { type: 'demo' | 'asset' | 'settings' | 'role' | 'user' | 'sync' | 'proposal' | 'auth' | 'system' | 'repository' | 'catalog'; id: string }
  summary: string
  details?: Record<string, unknown>
}

export type AuditInput = {
  actorEmail: string
  actorRole?: string
  action: string
  targetType: AuditEntry['target']['type']
  targetId: string
  summary?: string
  details?: Record<string, unknown>
}

export async function writeAudit(input: AuditInput): Promise<void> {
  if (!isDatabaseConfigured()) return
  const entry: AuditEntry = {
    id: randomUUID(),
    at: new Date().toISOString(),
    actorEmail: input.actorEmail,
    actorRole: input.actorRole ?? 'unknown',
    action: input.action,
    target: { type: input.targetType, id: input.targetId },
    summary: input.summary ?? `${input.action} ${input.targetType}:${input.targetId}`,
    details: input.details,
  }
  try {
    const col = await getCollection<AuditEntry>(COLLECTIONS.auditLogs)
    await col.insertOne(entry)
  } catch (err) {
    console.error('Audit write failed', err instanceof Error ? err.name : 'unknown')
  }
}

export async function listAudit(opts: { targetId?: string; limit?: number } = {}): Promise<AuditEntry[]> {
  if (!isDatabaseConfigured()) return []
  const col = await getCollection<AuditEntry & { _id?: unknown }>(COLLECTIONS.auditLogs)
  const docs = await col
    .find(opts.targetId ? { 'target.id': opts.targetId } : {}, { projection: { _id: 0 } })
    .sort({ at: -1 })
    .limit(Math.min(opts.limit ?? 50, 200))
    .toArray()
  return docs as AuditEntry[]
}

/** Shallow diff of top-level fields for audit details. */
export function diffFields(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  return Array.from(keys).filter((k) => k !== 'updatedAt' && JSON.stringify(before[k]) !== JSON.stringify(after[k]))
}
