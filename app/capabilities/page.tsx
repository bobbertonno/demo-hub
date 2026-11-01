import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, PageHero } from '@/components/shared/page'
import { requireBrowseAccess } from '@/lib/auth/session'
import { demosForCapability } from '@/lib/catalog/filters'
import { listCapabilities } from '@/lib/catalog/repository'
import { getVisibleDemos } from '@/lib/catalog/visible'

export const metadata: Metadata = { title: 'Capability explorer' }

export default async function CapabilitiesPage() {
  await requireBrowseAccess('/capabilities')
  const [capabilities, { data: demos }] = await Promise.all([listCapabilities(), getVisibleDemos()])

  return (
    <>
      <PageHero
        eyebrow="Capability explorer"
        title="Find demos by MongoDB capability"
        description="Each capability lists only demos whose catalog entry maps to it, with an explanation of how it is used. Mappings not yet confirmed against the repository are marked unverified."
      />
      <Container className="py-12">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="capability-grid">
          {capabilities.map((cap) => {
            const matches = demosForCapability(demos, cap.id)
            return (
              <li key={cap.id} data-testid="capability-card" data-capability={cap.id}>
                <article className="relative flex h-full flex-col gap-3 rounded-xl border bg-background p-6 shadow-sm transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-leaf-dark">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">{cap.shortName}</p>
                    <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium" aria-label={`${matches.length} matching demos`}>
                      {matches.length} {matches.length === 1 ? 'demo' : 'demos'}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold">
                    <Link href={`/capabilities/${cap.id}`} className="after:absolute after:inset-0 focus:outline-none">
                      {cap.name}
                    </Link>
                  </h2>
                  <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{cap.summary}</p>
                  {cap.verificationStatus === 'unverified' && (
                    <p className="text-xs font-medium text-warning">Description pending admin verification</p>
                  )}
                </article>
              </li>
            )
          })}
        </ul>
      </Container>
    </>
  )
}
