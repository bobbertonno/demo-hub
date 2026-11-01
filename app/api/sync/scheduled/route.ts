import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { handle } from '@/lib/api/http'
import { writeAudit } from '@/lib/audit'
import { getSettings } from '@/lib/catalog/settings'
import { getEnv } from '@/lib/config/env'
import { HttpError } from '@/lib/auth/session'
import { syncAll } from '@/lib/github/sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function authorized(req: Request): boolean {
  const secret = getEnv().CRON_SECRET
  if (!secret) return false
  const header = req.headers.get('authorization') ?? ''
  const expected = Buffer.from(`Bearer ${secret}`)
  const actual = Buffer.from(header)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

/** Called by Vercel Cron with `Authorization: Bearer $CRON_SECRET`. */
export const GET = handle(async (req: Request) => {
  if (!authorized(req)) throw new HttpError(401, 'Unauthorized')
  const settings = await getSettings()
  if (!settings.featureFlags.scheduledSync) return NextResponse.json({ skipped: 'Scheduled sync disabled in settings' })
  const outcomes = await syncAll('scheduled', null)
  await writeAudit({ actorEmail: 'system:cron', action: 'sync.scheduled', targetType: 'catalog', targetId: 'all', details: { count: outcomes.length } })
  return NextResponse.json({ results: outcomes.map((o) => ({ slug: o.job.demoSlug, status: o.job.status, error: o.job.error })) })
})
