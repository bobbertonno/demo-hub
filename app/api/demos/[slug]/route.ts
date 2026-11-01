import { NextResponse } from 'next/server'
import { assertSameOrigin, enforceRateLimit, handle, readJson } from '@/lib/api/http'
import { diffFields, writeAudit } from '@/lib/audit'
import { createProposal } from '@/lib/catalog/proposals'
import { deleteDemo, getDemoBySlug, getLatestSnapshot, updateDemo } from '@/lib/catalog/repository'
import { hasRole } from '@/lib/auth/roles'
import { HttpError, requireApiBrowse, requireApiRole } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ slug: string }> }

export const GET = handle(async (req: Request, { params }: Ctx) => {
  enforceRateLimit(req, 'demo:get', 120)
  const user = await requireApiBrowse()
  const { slug } = await params
  const demo = await getDemoBySlug(slug)
  if (!demo || (demo.status === 'archived' && !hasRole(user?.role, 'admin'))) throw new HttpError(404, 'Demo not found')
  const snapshot = await getLatestSnapshot(slug)
  return NextResponse.json({ demo, snapshot })
})

export const PUT = handle(async (req: Request, { params }: Ctx) => {
  assertSameOrigin(req)
  enforceRateLimit(req, 'demo:put', 30)
  const user = await requireApiRole('contributor')
  const { slug } = await params
  const body = await readJson(req)
  if (user.role !== 'admin') {
    const proposal = await createProposal({ payload: body, note: 'Edit proposal', slug }, user.email)
    await writeAudit({ actorEmail: user.email, action: 'proposal.create', targetType: 'proposal', targetId: proposal.id, details: { slug } })
    return NextResponse.json({ proposal }, { status: 202 })
  }
  const { before, after } = await updateDemo(slug, body)
  await writeAudit({ actorEmail: user.email, action: 'demo.update', targetType: 'demo', targetId: after.slug, details: { changedFields: diffFields(before, after) } })
  return NextResponse.json({ demo: after })
})

export const DELETE = handle(async (req: Request, { params }: Ctx) => {
  assertSameOrigin(req)
  const user = await requireApiRole('admin')
  const { slug } = await params
  const removed = await deleteDemo(slug)
  await writeAudit({ actorEmail: user.email, action: 'demo.delete', targetType: 'demo', targetId: slug, details: { title: removed.title } })
  return NextResponse.json({ ok: true })
})
