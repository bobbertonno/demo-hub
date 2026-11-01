import { NextResponse } from 'next/server'
import { assertSameOrigin, enforceRateLimit, handle } from '@/lib/api/http'
import { writeAudit } from '@/lib/audit'
import { HttpError, requireApiRole } from '@/lib/auth/session'
import { isDatabaseConfigured } from '@/lib/config/env'
import { bootstrapCatalog } from '@/lib/db/bootstrap'
import { getDb } from '@/lib/db/mongo'

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req)
  enforceRateLimit(req, 'admin:initialize', 5)
  const user = await requireApiRole('admin')
  if (!isDatabaseConfigured()) throw new HttpError(503, 'MONGODB_URI is not configured; nothing to initialize')
  const result = await bootstrapCatalog(await getDb())
  await writeAudit({
    actorEmail: user.email,
    action: 'catalog.initialize',
    targetType: 'settings',
    targetId: 'catalog',
    details: { ...result, migrationsApplied: result.migrationsApplied.length },
  })
  return NextResponse.json(result)
})
