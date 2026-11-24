import { after, NextResponse } from 'next/server'
import { assertSameOrigin, enforceRateLimit, handle } from '@/lib/api/http'
import { writeAudit } from '@/lib/audit'
import { requireApiBrowse, requireApiRole } from '@/lib/auth/session'
import { getDemoBySlug } from '@/lib/catalog/repository'
import { normalizeRepositoryInput } from '@/lib/import/normalize'
import { enqueueJob, getLatestJob, processJobById } from '@/lib/import/pipeline'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

type Ctx = { params: Promise<{ slug: string }> }

export const GET = handle(async (_req: Request, { params }: Ctx) => {
  await requireApiBrowse()
  const { slug } = await params
  const job = await getLatestJob(slug)
  return NextResponse.json({ job })
})

/** Sync Repository / Retry Enrichment: queues a full enrichment run. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  assertSameOrigin(req)
  enforceRateLimit(req, 'enrich', 20)
  const user = await requireApiRole('contributor')
  const { slug } = await params
  const demo = await getDemoBySlug(slug)
  if (!demo?.repository) return NextResponse.json({ error: 'Demo has no repository to synchronize' }, { status: 400 })
  const job = await enqueueJob(slug, normalizeRepositoryInput(demo.repository).key, 'sync', user.email)
  await writeAudit({ actorEmail: user.email, action: 'demo.enrich', targetType: 'demo', targetId: slug, details: { jobId: job.id } })
  after(() => processJobById(job.id))
  return NextResponse.json({ job: { id: job.id, status: job.status } }, { status: 202 })
})
