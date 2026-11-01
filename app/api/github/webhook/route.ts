import { NextResponse } from 'next/server'
import { z } from 'zod'
import { enforceRateLimit, handle } from '@/lib/api/http'
import { writeAudit } from '@/lib/audit'
import { getEnv } from '@/lib/config/env'
import { HttpError } from '@/lib/auth/session'
import { findDemosByRepository, syncDemo } from '@/lib/github/sync'
import { verifyGithubSignature } from '@/lib/github/webhook'

export const dynamic = 'force-dynamic'

const PushEvent = z.object({ ref: z.string().optional(), repository: z.object({ full_name: z.string().max(200) }) })

export const POST = handle(async (req: Request) => {
  enforceRateLimit(req, 'webhook', 60)
  const secret = getEnv().GITHUB_WEBHOOK_SECRET
  if (!secret) throw new HttpError(503, 'Webhook secret not configured')
  const raw = await req.text()
  if (raw.length > 1_000_000) throw new HttpError(413, 'Payload too large')
  if (!verifyGithubSignature(raw, req.headers.get('x-hub-signature-256'), secret)) throw new HttpError(401, 'Invalid signature')

  const event = req.headers.get('x-github-event')
  if (event === 'ping') return NextResponse.json({ ok: true })
  if (event !== 'push') return NextResponse.json({ ignored: event })

  const payload = PushEvent.parse(JSON.parse(raw))
  const demos = await findDemosByRepository(payload.repository.full_name)
  const branch = payload.ref?.replace('refs/heads/', '')
  const targets = demos.filter((d) => !branch || d.defaultBranch === branch)
  const results = []
  for (const d of targets) {
    const outcome = await syncDemo(d.slug, 'webhook', null)
    results.push({ slug: d.slug, status: outcome.job.status })
  }
  await writeAudit({ actorEmail: 'system:github-webhook', action: 'sync.webhook', targetType: 'repository', targetId: payload.repository.full_name, details: { synced: results.length } })
  return NextResponse.json({ results })
})
