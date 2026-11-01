'use client'

import { SegmentedControl, SegmentedControlOption } from '@/components/lg'
import { Option, Select } from '@leafygreen-ui/select'
import TextInput from '@leafygreen-ui/text-input'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { filterDemos, type CatalogQuery } from '@/lib/catalog/filters'
import { capabilityLabel, DIFFICULTY_LABELS, MATURITY_LABELS, RUNTIME_LABELS } from '@/lib/seed/capability-labels'
import { capabilityIds, type DemoRecord } from '@/lib/schemas/manifest'
import { DemoCard } from './demo-card'

type Facets = { industries: string[]; useCases: string[] }
type FilterKey = 'industry' | 'useCase' | 'capability' | 'difficulty' | 'runtime' | 'maturity'

export function CatalogExplorer({ demos, facets, initial }: { demos: DemoRecord[]; facets: Facets; initial: Partial<CatalogQuery> }) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const [query, setQuery] = useState<Partial<CatalogQuery>>(initial)
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')

  const results = useMemo(() => filterDemos(demos, query), [demos, query])

  function update(patch: Partial<CatalogQuery>) {
    const next = { ...query, ...patch }
    setQuery(next)
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(next)) if (v && !(k === 'sort' && v === 'title')) params.set(k, String(v))
    startTransition(() => router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false }))
  }

  const selects: { key: FilterKey; label: string; options: [string, string][] }[] = [
    { key: 'industry', label: 'Industry', options: facets.industries.map((v) => [v, v]) },
    { key: 'useCase', label: 'Use case', options: facets.useCases.map((v) => [v, v]) },
    { key: 'capability', label: 'MongoDB capability', options: capabilityIds.map((v) => [v, capabilityLabel(v)]) },
    { key: 'difficulty', label: 'Difficulty', options: Object.entries(DIFFICULTY_LABELS) },
    { key: 'runtime', label: 'Runtime mode', options: Object.entries(RUNTIME_LABELS) },
    { key: 'maturity', label: 'Maturity', options: Object.entries(MATURITY_LABELS) },
  ]
  const activeCount = selects.filter((s) => query[s.key]).length + (query.q ? 1 : 0)

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <aside aria-label="Filters" className="flex flex-col gap-5 lg:w-72 lg:shrink-0">
        <TextInput
          label="Search"
          type="search"
          placeholder="Title, tag, capability…"
          value={query.q ?? ''}
          onChange={(e) => update({ q: e.target.value || undefined })}
          data-testid="catalog-search"
        />
        {selects.map((s) => (
          <Select
            key={s.key}
            label={s.label}
            placeholder="Any"
            allowDeselect
            value={(query[s.key] as string | undefined) ?? ''}
            onChange={(v) => update({ [s.key]: v || undefined } as Partial<CatalogQuery>)}
            data-testid={`filter-${s.key}`}
          >
            {s.options.map(([value, label]) => (
              <Option key={value} value={value}>
                {label}
              </Option>
            ))}
          </Select>
        ))}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => update({ q: undefined, industry: undefined, useCase: undefined, capability: undefined, difficulty: undefined, runtime: undefined, maturity: undefined })}
            className="self-start text-sm font-semibold text-accent underline-offset-2 hover:underline"
          >
            Clear {activeCount} filter{activeCount > 1 ? 's' : ''}
          </button>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="text-sm text-muted-foreground" aria-live="polite" data-testid="result-count">
            {results.length} of {demos.length} demos
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-44">
              <Select label="Sort by" value={query.sort ?? 'title'} onChange={(v) => update({ sort: (v || 'title') as CatalogQuery['sort'] })}>
                <Option value="title">Title</Option>
                <Option value="updated">Recently updated</Option>
                <Option value="maturity">Maturity</Option>
              </Select>
            </div>
            <SegmentedControl label="View" value={layout} onChange={(v) => setLayout(v as 'grid' | 'list')}>
              <SegmentedControlOption value="grid">Cards</SegmentedControlOption>
              <SegmentedControlOption value="list">List</SegmentedControlOption>
            </SegmentedControl>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-surface p-12 text-center">
            <p className="font-semibold">No demos match these filters</p>
            <p className="mt-1 text-sm text-muted-foreground">Try removing a filter or broadening your search.</p>
          </div>
        ) : (
          <ul className={layout === 'grid' ? 'grid gap-6 md:grid-cols-2 xl:grid-cols-2' : 'flex flex-col gap-4'}>
            {results.map((d) => (
              <li key={d.slug}>
                <DemoCard demo={d} layout={layout} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
