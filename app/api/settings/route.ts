import { NextResponse } from 'next/server'
import { assertSameOrigin, handle, readJson } from '@/lib/api/http'
import { diffFields, writeAudit } from '@/lib/audit'
import { getSettings, saveSettings } from '@/lib/catalog/settings'
import { requireApiRole } from '@/lib/auth/session'
import { getDiagnostics } from '@/lib/config/env'

export const dynamic = 'force-dynamic'

export const GET = handle(async () => {
  await requireApiRole('admin')
  return NextResponse.json({ settings: await getSettings(), diagnostics: getDiagnostics() })
})

export const PUT = handle(async (req: Request) => {
  assertSameOrigin(req)
  const user = await requireApiRole('admin')
  const before = await getSettings()
  const after = await saveSettings(await readJson(req), user.email)
  await writeAudit({ actorEmail: user.email, action: 'settings.update', targetType: 'settings', targetId: 'catalog', details: { changedFields: diffFields(before, after) } })
  return NextResponse.json({ settings: after })
})
