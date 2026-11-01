import { NextResponse } from 'next/server'
import { z } from 'zod'
import { assertSameOrigin, handle, readJson } from '@/lib/api/http'
import { writeAudit } from '@/lib/audit'
import { ROLES } from '@/lib/auth/roles'
import { HttpError, listUserRoles, requireApiRole, setUserRole } from '@/lib/auth/session'
import { allowedEmailDomains, isDatabaseConfigured } from '@/lib/config/env'

export const dynamic = 'force-dynamic'

export const GET = handle(async () => {
  await requireApiRole('admin')
  return NextResponse.json({ roles: await listUserRoles() })
})

export const PUT = handle(async (req: Request) => {
  assertSameOrigin(req)
  const user = await requireApiRole('admin')
  if (!isDatabaseConfigured()) throw new HttpError(503, 'Role assignments require MONGODB_URI')
  const { email, role } = z.object({ email: z.string().email().max(200), role: z.enum(ROLES) }).parse(await readJson(req))
  const domain = email.toLowerCase().split('@')[1]
  if (!allowedEmailDomains().includes(domain)) throw new HttpError(422, 'Email must belong to an allowed corporate domain')
  if (email.toLowerCase() === user.email && role !== 'admin') throw new HttpError(422, 'You cannot demote yourself')
  await setUserRole(email, role, user.email)
  await writeAudit({ actorEmail: user.email, action: 'role.assign', targetType: 'user', targetId: email.toLowerCase(), details: { role } })
  return NextResponse.json({ ok: true })
})
