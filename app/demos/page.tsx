import type { Metadata } from 'next'
import { CatalogExplorer } from '@/components/demos/catalog-explorer'
import { Container, PageHero } from '@/components/shared/page'
import { requireBrowseAccess } from '@/lib/auth/session'
import { CatalogQuery, facetValues } from '@/lib/catalog/filters'
import { getVisibleDemos } from '@/lib/catalog/visible'

export const metadata: Metadata = { title: 'Demo catalog', description: 'Search and filter MongoDB Solutions Architect demos.' }

export default async function DemosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireBrowseAccess('/demos')
  const raw = await searchParams
  const flat = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]))
  const parsed = CatalogQuery.safeParse(flat)
  const initial = parsed.success ? parsed.data : { sort: 'title' as const }
  const { data: demos, degraded } = await getVisibleDemos()

  return (
    <>
      <PageHero
        eyebrow="Catalog"
        title="Demo catalog"
        description="Filter by industry, use case, MongoDB capability, difficulty, runtime mode and maturity. Each entry links to its own independent repository."
      />
      <Container className="py-10">
        {degraded && (
          <p role="status" className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100">
            {degraded}
          </p>
        )}
        <CatalogExplorer demos={demos} facets={facetValues(demos)} initial={initial} />
      </Container>
    </>
  )
}
