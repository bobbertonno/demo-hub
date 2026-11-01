import { z } from 'zod'
import { CapabilityId, Difficulty, Maturity, RuntimeMode, type DemoRecord } from '@/lib/schemas/manifest'

export const CatalogQuery = z.object({
  q: z.string().max(200).optional(),
  industry: z.string().max(80).optional(),
  useCase: z.string().max(80).optional(),
  capability: CapabilityId.optional(),
  difficulty: Difficulty.optional(),
  runtime: RuntimeMode.optional(),
  maturity: Maturity.optional(),
  sort: z.enum(['title', 'updated', 'maturity']).default('title'),
})
export type CatalogQuery = z.infer<typeof CatalogQuery>

const maturityRank: Record<string, number> = { stable: 0, beta: 1, prototype: 2, concept: 3, deprecated: 4 }

export function searchText(demo: DemoRecord): string {
  return [demo.title, demo.tagline, demo.summary, demo.industry, demo.category, ...demo.tags, ...demo.useCases, ...demo.capabilities.map((c) => c.capability)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function filterDemos(demos: DemoRecord[], query: Partial<CatalogQuery>): DemoRecord[] {
  const terms = (query.q ?? '').toLowerCase().split(/\s+/).filter(Boolean)
  const result = demos.filter((d) => {
    if (query.industry && d.industry !== query.industry) return false
    if (query.useCase && !d.useCases.includes(query.useCase)) return false
    if (query.capability && !d.capabilities.some((c) => c.capability === query.capability)) return false
    if (query.difficulty && d.difficulty !== query.difficulty) return false
    if (query.runtime && !d.demoModes.includes(query.runtime)) return false
    if (query.maturity && d.maturity !== query.maturity) return false
    if (terms.length) {
      const hay = searchText(d)
      if (!terms.every((t) => hay.includes(t))) return false
    }
    return true
  })
  const sort = query.sort ?? 'title'
  return result.sort((a, b) => {
    if (sort === 'updated') return b.updatedAt.localeCompare(a.updatedAt)
    if (sort === 'maturity') return (maturityRank[a.maturity] ?? 9) - (maturityRank[b.maturity] ?? 9) || a.title.localeCompare(b.title)
    return a.title.localeCompare(b.title)
  })
}

export function facetValues(demos: DemoRecord[]) {
  const uniq = (xs: string[]) => Array.from(new Set(xs)).sort()
  return {
    industries: uniq(demos.map((d) => d.industry)),
    useCases: uniq(demos.flatMap((d) => d.useCases)),
  }
}

export function demosForCapability(demos: DemoRecord[], capability: string) {
  return demos
    .map((d) => ({ demo: d, mapping: d.capabilities.find((c) => c.capability === capability) }))
    .filter((x): x is { demo: DemoRecord; mapping: NonNullable<typeof x.mapping> } => Boolean(x.mapping))
}
