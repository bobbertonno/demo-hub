import { NextResponse } from 'next/server'
import { z } from 'zod'
import { enforceRateLimit, handle } from '@/lib/api/http'
import { hasRole } from '@/lib/auth/roles'
import { requireApiBrowse } from '@/lib/auth/session'
import { getCatalogMode } from '@/lib/catalog/repository'
import { autocompleteTitles, searchCatalog } from '@/lib/search/catalog-search'

export const dynamic = 'force-dynamic'

const Query = z.object({
  q: z.string().trim().min(1).max(200),
  mode: z.enum(['search', 'autocomplete']).default('search'),
  category: z.string().max(120).optional(),
  capability: z.string().max(60).optional(),
  compatibility: z.enum(['basic', 'enhanced', 'fully-compatible']).optional(),
})

export const GET = handle(async (req: Request) => {
  enforceRateLimit(req, 'search', 120)
  const user = await requireApiBrowse()
  if (getCatalogMode() === 'seed') return NextResponse.json({ available: false, reason: 'No MongoDB database configured' })
  const params = Query.parse(Object.fromEntries(new URL(req.url).searchParams))
  const statuses = hasRole(user?.role, 'contributor') ? ['published', 'in_review', 'draft'] : ['published']
  if (params.mode === 'autocomplete') return NextResponse.json({ suggestions: await autocompleteTitles(params.q, statuses) })
  return NextResponse.json(await searchCatalog({ ...params, statuses }))
})
