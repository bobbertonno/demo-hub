import type { ReactNode } from 'react'

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
}

/** Dark forest-green hero band used at the top of every public page. */
export function PageHero({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-hero text-hero-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,237,100,0.16),transparent_55%)]" />
      <Container className="relative py-12 md:py-16">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-leaf">{eyebrow}</p>}
        <h1 className="mt-3 max-w-3xl text-balance text-3xl font-semibold leading-tight md:text-5xl">{title}</h1>
        {description && <div className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-white/75 md:text-lg">{description}</div>}
        {children && <div className="mt-8">{children}</div>}
      </Container>
    </section>
  )
}

export function Section({ id, title, description, children, className = '' }: { id?: string; title?: string; description?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={id && title ? `${id}-title` : undefined} className={`scroll-mt-24 ${className}`}>
      {title && (
        <h2 id={id ? `${id}-title` : undefined} className="text-2xl font-semibold tracking-tight">
          {title}
        </h2>
      )}
      {description && <div className="mt-2 max-w-3xl text-muted-foreground">{description}</div>}
      <div className={title || description ? 'mt-6' : ''}>{children}</div>
    </section>
  )
}

export function EmptyState({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-surface px-6 py-12 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {description && <div className="mt-2 max-w-md text-sm text-muted-foreground">{description}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit', timeZone: 'UTC' })
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Never'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.toLocaleString('en-GB', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC`
}
