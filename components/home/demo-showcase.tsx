'use client'

import { useMemo, useState } from 'react'
import { Filter, Search } from 'lucide-react'
import type { DemoRecord } from '@/lib/schemas/manifest'
import { ShowcaseCard } from './showcase-card'

const ALL = 'all'

export function DemoShowcase({ demos, unavailableReason }: { demos: DemoRecord[]; unavailableReason?: string }) {
  const [category, setCategory] = useState(ALL)
  const [query, setQuery] = useState('')

  const categories = useMemo(
    () => Array.from(new Set(demos.map((d) => d.category ?? d.industry))).sort(),
    [demos],
  )

  const q = query.trim().toLowerCase()
  const visible = demos.filter((d) => {
    if (category !== ALL && (d.category ?? d.industry) !== category) return false
    if (!q) return true
    return [d.title, d.tagline ?? '', d.summary, ...d.tags, ...d.useCases].some((v) => v.toLowerCase().includes(q))
  })

  return (
    <section id="demos" aria-labelledby="demos-heading" className="flex scroll-mt-24 flex-col gap-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 id="demos-heading" className="text-2xl font-semibold md:text-3xl">
            Available demos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            Discover guided demos, run end-to-end scenarios and see MongoDB Atlas in action.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex items-center">
            <span className="sr-only">Filter by use case</span>
            <Filter className="pointer-events-none absolute left-3 size-4 text-muted-foreground" aria-hidden />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 w-full appearance-none rounded-lg border bg-background pl-9 pr-9 text-sm sm:w-56"
            >
              <option value={ALL}>All use cases</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none absolute right-3 size-4 text-muted-foreground">
              <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </label>
          <label className="relative flex items-center">
            <span className="sr-only">Search demos</span>
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a demo..."
              className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm sm:w-64"
            />
          </label>
        </div>
      </div>

      {visible.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {visible.map((d) => (
            <li key={d.slug}>
              <ShowcaseCard demo={d} />
            </li>
          ))}
        </ul>
      ) : unavailableReason ? (
        <div role="alert" className="rounded-xl border border-dashed border-red-300 p-8 text-center text-sm">
          <p className="font-semibold">The demo catalog database is unreachable.</p>
          <p className="mt-1 text-muted-foreground">
            Check that this environment&apos;s IP is allowed in Atlas Network Access. ({unavailableReason})
          </p>
        </div>
      ) : (
        <p role="status" className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {demos.length ? 'No demos match your filters.' : 'No demos are published yet.'}
        </p>
      )}
    </section>
  )
}
