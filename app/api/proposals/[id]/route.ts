import { NextResponse } from 'next/server'
import { z } from 'zod'
import { assertSameOrigin, handle, readJson } from '@/lib/api/http'
import { writeAudit } from '@/lib/audit'
import { reviewProposal } from '@/lib/catalog/proposals'
import { requireApiRole } from '@/lib/auth/session'

type Ctx = { params: Promise<{ id: string }> }

export const POST = handle(async (req: Request, { params }: Ctx) => {
  assertSameOrigin(req)
  const user = await requireApiRole('admin')
  const { id } = await params
  const { decision, note } = z.object({ decision: z.enum(['approved', 'rejected']), note: z.string().max(1000).default('') }).parse(await readJson(req))
  const proposal = await reviewProposal(id, decision, user.email, note)
  await writeAudit({ actorEmail: user.email, action: `proposal.${decision}`, targetType: 'proposal', targetId: id, details: { slug: proposal.demoSlug } })
  return NextResponse.json({ proposal })
})
