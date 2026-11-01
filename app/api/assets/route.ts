import { NextResponse } from 'next/server'
import { z } from 'zod'
import { assertSameOrigin, enforceRateLimit, handle } from '@/lib/api/http'
import { writeAudit } from '@/lib/audit'
import { getDemoBySlug } from '@/lib/catalog/repository'
import { HttpError, requireApiRole } from '@/lib/auth/session'
import { listAssets, storeAsset } from '@/lib/storage/assets'
import { SLUG_PATTERN } from '@/lib/schemas/manifest'

export const dynamic = 'force-dynamic'

export const GET = handle(async (req: Request) => {
  await requireApiRole('admin')
  const slug = z.string().regex(SLUG_PATTERN).parse(new URL(req.url).searchParams.get('slug'))
  return NextResponse.json({ assets: await listAssets(slug) })
})

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req)
  enforceRateLimit(req, 'assets:upload', 30)
  const user = await requireApiRole('admin')
  const form = await req.formData()
  const slug = z.string().regex(SLUG_PATTERN).parse(form.get('slug'))
  const kind = z.enum(['screenshot', 'logo']).parse(form.get('kind') ?? 'screenshot')
  const file = form.get('file')
  if (!(file instanceof File)) throw new HttpError(400, 'Missing file')
  if (!(await getDemoBySlug(slug))) throw new HttpError(404, 'Demo not found')
  const asset = await storeAsset(file, slug, kind, user.email)
  await writeAudit({ actorEmail: user.email, action: 'asset.upload', targetType: 'demo', targetId: slug, details: { assetId: asset.id, size: asset.size } })
  return NextResponse.json({ asset: { id: asset.id, url: `/api/assets/${asset.id}`, contentType: asset.contentType, size: asset.size } }, { status: 201 })
})
