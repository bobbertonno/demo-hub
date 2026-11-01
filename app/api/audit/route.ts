import { NextResponse } from 'next/server'
import { handle } from '@/lib/api/http'
import { listAudit } from '@/lib/audit'
import { requireApiRole } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export const GET = handle(async (req: Request) => {
  await requireApiRole('admin')
  const sp = new URL(req.url).searchParams
  const limit = Math.min(Number(sp.get('limit') ?? 100) || 100, 500)
  return NextResponse.json({ entries: await listAudit({ targetId: sp.get('targetId') ?? undefined, limit }) })
})
