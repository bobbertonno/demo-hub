import { after, NextResponse } from 'next/server'
import { z } from 'zod'
import { assertSameOrigin, enforceRateLimit, handle, readJson } from '@/lib/api/http'
import { writeAudit } from '@/lib/audit'
import { requireApiRole } from '@/lib/auth/session'
import { ImportError, importRepository, processJobById } from '@/lib/import/pipeline'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const Body = z.object({ url: z.string().min(1).max(400), ref: z.string().max(120).regex(/^[A-Za-z0-9_./-]*$/).optional() })

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req)
  enforceRateLimit(req, 'import', 10)
  const user = await requireApiRole('contributor')
  const body = Body.parse(await readJson(req, 8_000))
  try {
    const { demo, job } = await importRepository({ url: body.url, ref: body.ref || null }, { email: user.email, role: user.role })
    await writeAudit({ actorEmail: user.email, action: 'demo.import', targetType: 'demo', targetId: demo.slug, details: { repository: demo.repository, jobId: job.id } })
    after(() => processJobById(job.id))
    return NextResponse.json({ demo: { slug: demo.slug, title: demo.title, status: demo.status }, job: { id: job.id, status: job.status } }, { status: 201 })
  } catch (e) {
    if (e instanceof ImportError) return NextResponse.json({ error: e.message, slug: e.slug ?? null }, { status: e.status })
    throw e
  }
})
