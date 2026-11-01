import Link from 'next/link'
import { capabilityLabel, RUNTIME_LABELS } from '@/lib/seed/capability-labels'
import type { DemoRecord } from '@/lib/schemas/manifest'
import { DocStatusBadge, MaturityBadge, StatusBadge } from '@/components/shared/status-badges'

export function DemoCard({ demo, layout = 'grid' }: { demo: DemoRecord; layout?: 'grid' | 'list' }) {
  const caps = demo.capabilities.slice(0, layout === 'list' ? 8 : 4)
  const extra = demo.capabilities.length - caps.length
  return (
    <article
      data-testid="demo-card"
      data-slug={demo.slug}
      className={`group relative flex rounded-xl border bg-background p-6 shadow-sm transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-leaf-dark ${layout === 'list' ? 'flex-col gap-4 md:flex-row md:items-start' : 'h-full flex-col gap-4'}`}
    >
      <div className={`flex flex-col gap-3 ${layout === 'list' ? 'md:flex-1' : 'flex-1'}`}>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={demo.status} />
          <MaturityBadge maturity={demo.maturity} />
          <DocStatusBadge status={demo.documentationStatus} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">{demo.category ?? demo.industry}</p>
          <h3 className="mt-1 text-lg font-semibold leading-snug">
            <Link href={`/demos/${demo.slug}`} className="after:absolute after:inset-0 focus:outline-none">
              {demo.title}
            </Link>
          </h3>
          {demo.tagline && <p className="mt-1 text-sm text-muted-foreground">{demo.tagline}</p>}
        </div>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{demo.summary}</p>
      </div>
      <div className={`flex flex-col gap-3 ${layout === 'list' ? 'md:w-80' : ''}`}>
        <ul className="flex flex-wrap gap-1.5" aria-label="MongoDB capabilities">
          {caps.map((c) => (
            <li key={c.capability} className="rounded-full bg-mint/60 px-2.5 py-0.5 text-xs font-medium text-forest dark:bg-forest dark:text-mint">
              {capabilityLabel(c.capability)}
            </li>
          ))}
          {extra > 0 && <li className="rounded-full bg-surface px-2.5 py-0.5 text-xs text-muted-foreground">+{extra} more</li>}
        </ul>
        <p className="text-xs text-muted-foreground">
          {demo.demoModes.map((m) => RUNTIME_LABELS[m] ?? m).join(' · ')}
          {' · '}
          {demo.repository ? 'Repository linked' : 'Repository pending'}
        </p>
      </div>
    </article>
  )
}
