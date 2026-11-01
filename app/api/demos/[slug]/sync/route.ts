import { NextResponse } from 'next/server'
import { z } from 'zod'
import { assertSameOrigin, enforceRateLimit, handle, readJson } from '@/lib/api/http'
import { writeAudit } from '@/lib/audit'
import { requireApiRole } from '@/lib/auth/session'
import { syncDemo } from '@/lib/github/sync'

type Ctx = { params: Promise<{ slug: string }> }

export const POST = handle(async (req: Request, { params }: Ctx) => {
  assertSameOrigin(req)
  enforceRateLimit(req, 'sync:manual', 10)
  const user = await requireApiRole('admin')
  const { slug } = await params
  const raw = await req.clone().text()
  const { ref } = z.object({ ref: z.string().max(120).optional() }).parse(raw ? await readJson(req) : {})
  const outcome = await syncDemo(slug, 'manual', user.email, { ref })
  await writeAudit({ actorEmail: user.email, action: 'demo.sync', targetType: 'demo', targetId: slug, details: { status: outcome.job.status, ref: ref ?? null } })
  return NextResponse.json(outcome, { status: outcome.job.status === 'failed' ? 502 : 200 })
})
