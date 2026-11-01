import { NextResponse } from 'next/server'
import { z } from 'zod'
import { assertSameOrigin, handle, readJson } from '@/lib/api/http'
import { writeAudit } from '@/lib/audit'
import { setDemoStatus } from '@/lib/catalog/repository'
import { requireApiRole } from '@/lib/auth/session'
import { DemoStatus } from '@/lib/schemas/manifest'

type Ctx = { params: Promise<{ slug: string }> }

/** Publish, archive, return to draft or mark in review. Admin only. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  assertSameOrigin(req)
  const user = await requireApiRole('admin')
  const { slug } = await params
  const { status } = z.object({ status: DemoStatus }).parse(await readJson(req))
  const demo = await setDemoStatus(slug, status)
  await writeAudit({ actorEmail: user.email, action: `demo.status.${status}`, targetType: 'demo', targetId: slug, details: { status } })
  return NextResponse.json({ demo })
})
