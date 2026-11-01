import { NextResponse } from 'next/server'
import { assertSameOrigin, enforceRateLimit, handle, readJson } from '@/lib/api/http'
import { writeAudit } from '@/lib/audit'
import { CatalogQuery, filterDemos } from '@/lib/catalog/filters'
import { createProposal } from '@/lib/catalog/proposals'
import { createDemo, listDemos } from '@/lib/catalog/repository'
import { getSettings } from '@/lib/catalog/settings'
import { hasRole } from '@/lib/auth/roles'
import { requireApiBrowse, requireApiRole } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

/** Search + filter the catalog. Viewers only see published (and drafts when enabled). */
export const GET = handle(async (req: Request) => {
  enforceRateLimit(req, 'demos:get', 120)
  const user = await requireApiBrowse()
  const params = Object.fromEntries(new URL(req.url).searchParams)
  const query = CatalogQuery.parse(params)
  const isAdmin = hasRole(user?.role, 'admin')
  const settings = await getSettings()
  const { data, mode, degraded } = await listDemos({ includeArchived: isAdmin && params.includeArchived === 'true' })
  const visible = data.filter((d) => isAdmin || d.status === 'published' || (settings.showDraftsInCatalog && (d.status === 'draft' || d.status === 'in_review')))
  const results = filterDemos(visible, query)
  return NextResponse.json({ mode, degraded: degraded ?? null, count: results.length, demos: results })
})

/** Admins create directly; contributors submit a proposal for review. */
export const POST = handle(async (req: Request) => {
  assertSameOrigin(req)
  enforceRateLimit(req, 'demos:post', 20)
  const user = await requireApiRole('contributor')
  const body = await readJson(req)
  if (user.role === 'admin') {
    const demo = await createDemo(body)
    await writeAudit({ actorEmail: user.email, action: 'demo.create', targetType: 'demo', targetId: demo.slug, details: { title: demo.title } })
    return NextResponse.json({ demo }, { status: 201 })
  }
  const proposal = await createProposal({ payload: body, note: 'New demo proposal' }, user.email)
  await writeAudit({ actorEmail: user.email, action: 'proposal.create', targetType: 'proposal', targetId: proposal.id, details: { kind: 'create' } })
  return NextResponse.json({ proposal }, { status: 202 })
})
