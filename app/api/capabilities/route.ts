import { NextResponse } from 'next/server'
import { enforceRateLimit, handle } from '@/lib/api/http'
import { demosForCapability } from '@/lib/catalog/filters'
import { listCapabilities, listDemos } from '@/lib/catalog/repository'
import { requireApiBrowse } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export const GET = handle(async (req: Request) => {
  enforceRateLimit(req, 'capabilities', 120)
  await requireApiBrowse()
  const [capabilities, demos] = await Promise.all([listCapabilities(), listDemos()])
  return NextResponse.json({
    capabilities: capabilities.map((c) => ({
      ...c,
      demos: demosForCapability(demos.data, c.id).map(({ demo, mapping }) => ({ slug: demo.slug, title: demo.title, whyUsed: mapping.whyUsed, verified: mapping.verified })),
    })),
  })
})
