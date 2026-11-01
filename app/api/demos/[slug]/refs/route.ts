import { NextResponse } from 'next/server'
import { enforceRateLimit, handle } from '@/lib/api/http'
import { getDemoBySlug } from '@/lib/catalog/repository'
import { HttpError, requireApiBrowse } from '@/lib/auth/session'
import { githubAuthMode } from '@/lib/config/env'
import { listRefs, parseRepoUrl } from '@/lib/github/client'

type Ctx = { params: Promise<{ slug: string }> }

export const GET = handle(async (req: Request, { params }: Ctx) => {
  enforceRateLimit(req, 'refs', 20)
  await requireApiBrowse()
  const { slug } = await params
  const demo = await getDemoBySlug(slug)
  if (!demo) throw new HttpError(404, 'Demo not found')
  if (!demo.repository) return NextResponse.json({ branches: [], tags: [], reason: 'No repository registered' })
  if (githubAuthMode() === 'none') return NextResponse.json({ branches: [demo.defaultBranch], tags: [], reason: 'GitHub credentials not configured' })
  const refs = await listRefs(parseRepoUrl(demo.repository))
  return NextResponse.json(refs, { headers: { 'cache-control': 'private, max-age=300' } })
})
