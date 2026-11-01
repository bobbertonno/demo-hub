import { NextResponse } from 'next/server'
import { assertSameOrigin, handle } from '@/lib/api/http'
import { writeAudit } from '@/lib/audit'
import { HttpError, requireApiBrowse, requireApiRole } from '@/lib/auth/session'
import { deleteAsset, getAsset, readAssetStream } from '@/lib/storage/assets'

type Ctx = { params: Promise<{ id: string }> }

/** Authenticated proxy for private blob assets. */
export const GET = handle(async (_req: Request, { params }: Ctx) => {
  await requireApiBrowse()
  const { id } = await params
  const asset = await getAsset(id)
  if (!asset) throw new HttpError(404, 'Asset not found')
  const result = await readAssetStream(asset)
  if (!result || !result.stream) throw new HttpError(404, 'Asset not found')
  return new Response(result.stream, {
    headers: {
      'content-type': asset.contentType,
      'x-content-type-options': 'nosniff',
      'cache-control': 'private, max-age=3600',
      'content-security-policy': "default-src 'none'",
    },
  })
})

export const DELETE = handle(async (req: Request, { params }: Ctx) => {
  assertSameOrigin(req)
  const user = await requireApiRole('admin')
  const { id } = await params
  const asset = await deleteAsset(id)
  if (!asset) throw new HttpError(404, 'Asset not found')
  await writeAudit({ actorEmail: user.email, action: 'asset.delete', targetType: 'demo', targetId: asset.demoSlug, details: { assetId: id } })
  return NextResponse.json({ ok: true })
})
