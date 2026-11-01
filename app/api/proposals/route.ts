import { NextResponse } from 'next/server'
import { handle } from '@/lib/api/http'
import { listProposals } from '@/lib/catalog/proposals'
import { requireApiRole } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export const GET = handle(async (req: Request) => {
  const user = await requireApiRole('contributor')
  const status = new URL(req.url).searchParams.get('status')
  const all = await listProposals(status === 'pending' || status === 'approved' || status === 'rejected' ? status : undefined)
  const visible = user.role === 'admin' ? all : all.filter((p) => p.proposedBy === user.email)
  return NextResponse.json({ proposals: visible })
})
