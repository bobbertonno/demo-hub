import 'server-only'
import { randomUUID } from 'node:crypto'
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
  blobPathname: string
  blobUrl: string
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

export function isObjectStorageConfigured() {
  return Boolean(getEnv().BLOB_READ_WRITE_TOKEN)
}

export async function storeAsset(file: File, demoSlug: string, kind: DemoAsset['kind'], actor: string): Promise<DemoAsset> {
  if (!isObjectStorageConfigured()) throw new HttpError(503, 'Object storage is not configured (BLOB_READ_WRITE_TOKEN).')
  if (file.size > MAX_ASSET_BYTES) throw new HttpError(413, 'Image exceeds 5 MB')
  const bytes = new Uint8Array(await file.arrayBuffer())
  const sniffed = sniffImageType(bytes)
  if (!sniffed || !(ALLOWED_IMAGE_TYPES as readonly string[]).includes(sniffed)) throw new HttpError(415, 'Only PNG, JPEG or WebP images are accepted')
  const { put } = await import('@vercel/blob')
  const id = randomUUID().replace(/-/g, '')
  const ext = sniffed.split('/')[1]
  const blob = await put(`demo-hub/${demoSlug}/${id}.${ext}`, Buffer.from(bytes), { access: 'private', contentType: sniffed, addRandomSuffix: false })
  const asset: DemoAsset = { id, demoSlug, kind, contentType: sniffed, size: bytes.length, blobPathname: blob.pathname, blobUrl: blob.url, uploadedBy: actor, uploadedAt: new Date().toISOString() }
  const col = await getCollection<DemoAsset>(COLLECTIONS.demoAssets)
  await col.insertOne({ ...asset })
  return asset
}

export async function getAsset(id: string): Promise<DemoAsset | null> {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id)) return null
  const col = await getCollection<DemoAsset>(COLLECTIONS.demoAssets)
  return col.findOne({ id }, { projection: { _id: 0 } })
}

export async function readAssetStream(asset: DemoAsset) {
  const { get } = await import('@vercel/blob')
  return get(asset.blobPathname, { access: 'private' })
}

export async function deleteAsset(id: string): Promise<DemoAsset | null> {
  const asset = await getAsset(id)
  if (!asset) return null
  const { del } = await import('@vercel/blob')
  await del(asset.blobUrl)
  const col = await getCollection<DemoAsset>(COLLECTIONS.demoAssets)
  await col.deleteOne({ id })
  return asset
}

export async function listAssets(demoSlug: string): Promise<DemoAsset[]> {
  const col = await getCollection<DemoAsset>(COLLECTIONS.demoAssets)
  return col.find({ demoSlug }, { projection: { _id: 0 } }).sort({ uploadedAt: -1 }).limit(100).toArray()
}
