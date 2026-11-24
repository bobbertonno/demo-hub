import 'server-only'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getEnv } from '@/lib/config/env'
import { COLLECTIONS, getCollection } from '@/lib/db/mongo'
import { HttpError } from '@/lib/auth/session'

export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
export const MAX_ASSET_BYTES = 5 * 1024 * 1024

export type DemoAsset = {
  id: string
  demoSlug: string
  kind: 'screenshot' | 'logo'
  contentType: string
  size: number
  /** Path relative to the asset storage directory. */
  storagePath: string
  uploadedBy: string
  uploadedAt: string
}

/** Validates real file signatures (magic bytes), not just the declared MIME type. */
export function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png'
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp'
  return null
}

function storageRoot() {
  return path.resolve(getEnv().ASSET_STORAGE_DIR)
}

/** Resolves a stored path and refuses anything that escapes the storage directory. */
function resolveStoragePath(relative: string) {
  const root = storageRoot()
  const full = path.resolve(root, relative)
  if (full !== root && !full.startsWith(root + path.sep)) throw new HttpError(400, 'Invalid asset path')
  return full
}

export function isObjectStorageConfigured() {
  return true
}

export async function storeAsset(file: File, demoSlug: string, kind: DemoAsset['kind'], actor: string): Promise<DemoAsset> {
  if (file.size > MAX_ASSET_BYTES) throw new HttpError(413, 'Image exceeds 5 MB')
  if (!/^[a-z0-9][a-z0-9-]{0,99}$/.test(demoSlug)) throw new HttpError(400, 'Invalid demo slug')
  const bytes = new Uint8Array(await file.arrayBuffer())
  const sniffed = sniffImageType(bytes)
  if (!sniffed || !(ALLOWED_IMAGE_TYPES as readonly string[]).includes(sniffed)) throw new HttpError(415, 'Only PNG, JPEG or WebP images are accepted')
  const id = randomUUID().replace(/-/g, '')
  const storagePath = `${demoSlug}/${id}.${sniffed.split('/')[1]}`
  const full = resolveStoragePath(storagePath)
  await mkdir(path.dirname(full), { recursive: true })
  await writeFile(full, bytes)
  const asset: DemoAsset = { id, demoSlug, kind, contentType: sniffed, size: bytes.length, storagePath, uploadedBy: actor, uploadedAt: new Date().toISOString() }
  const col = await getCollection<DemoAsset>(COLLECTIONS.demoAssets)
  await col.insertOne({ ...asset })
  return asset
}

export async function getAsset(id: string): Promise<DemoAsset | null> {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id)) return null
  const col = await getCollection<DemoAsset>(COLLECTIONS.demoAssets)
  return col.findOne({ id }, { projection: { _id: 0 } })
}

export async function readAssetBytes(asset: DemoAsset): Promise<Buffer | null> {
  if (!asset.storagePath) return null
  try {
    return await readFile(resolveStoragePath(asset.storagePath))
  } catch {
    return null
  }
}

export async function deleteAsset(id: string): Promise<DemoAsset | null> {
  const asset = await getAsset(id)
  if (!asset) return null
  if (asset.storagePath) await rm(resolveStoragePath(asset.storagePath), { force: true })
  const col = await getCollection<DemoAsset>(COLLECTIONS.demoAssets)
  await col.deleteOne({ id })
  return asset
}

export async function listAssets(demoSlug: string): Promise<DemoAsset[]> {
  const col = await getCollection<DemoAsset>(COLLECTIONS.demoAssets)
  return col.find({ demoSlug }, { projection: { _id: 0 } }).sort({ uploadedAt: -1 }).limit(100).toArray()
}
