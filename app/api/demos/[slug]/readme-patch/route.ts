import { handle } from '@/lib/api/http'
import { getDemoBySlug, getLatestSnapshot } from '@/lib/catalog/repository'
import { HttpError, requireApiRole } from '@/lib/auth/session'
import { getRawFile, parseRepoUrl } from '@/lib/github/client'
import { proposeReadme } from '@/lib/github/readme-patch'

type Ctx = { params: Promise<{ slug: string }> }

/**
 * Generates a downloadable unified diff suggesting README updates.
 * Never writes to the demo repository.
 */
export const GET = handle(async (req: Request, { params }: Ctx) => {
  await requireApiRole('admin')
  const { slug } = await params
  const demo = await getDemoBySlug(slug)
  if (!demo) throw new HttpError(404, 'Demo not found')
  let current: string | null = null
  const snapshot = await getLatestSnapshot(slug)
  if (demo.repository && snapshot && !snapshot.readme.missing) {
    try {
      const res = await getRawFile(parseRepoUrl(demo.repository), demo.readmePath, snapshot.ref)
      if (res.status === 'ok') current = res.data
    } catch {
      current = null
    }
  }
  const { patch, proposed } = proposeReadme(current, demo)
  const format = new URL(req.url).searchParams.get('format')
  const body = format === 'markdown' ? proposed : patch
  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'content-disposition': `attachment; filename="${slug}-${format === 'markdown' ? 'README.proposed.md' : 'README.patch'}"`,
      'cache-control': 'no-store',
    },
  })
})
