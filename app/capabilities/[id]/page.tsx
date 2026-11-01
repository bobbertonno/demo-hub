import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container, EmptyState, PageHero, Section } from '@/components/shared/page'
import { StatusBadge } from '@/components/shared/status-badges'
import { requireBrowseAccess } from '@/lib/auth/session'
import { demosForCapability } from '@/lib/catalog/filters'
import { listCapabilities } from '@/lib/catalog/repository'
import { getVisibleDemos } from '@/lib/catalog/visible'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const cap = (await listCapabilities()).find((c) => c.id === id)
  return { title: cap ? cap.name : 'Capability' }
}

export default async function CapabilityDetailPage({ params }: Props) {
  const { id } = await params
  await requireBrowseAccess(`/capabilities/${id}`)
  const [capabilities, { data: demos }] = await Promise.all([listCapabilities(), getVisibleDemos()])
  const cap = capabilities.find((c) => c.id === id)
  if (!cap) notFound()
  const matches = demosForCapability(demos, cap.id)

  return (
    <>
      <PageHero eyebrow="Capability" title={cap.name} description={cap.summary}>
        <a href={cap.docsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/10">
          Official documentation
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </PageHero>
      <Container className="grid gap-12 py-12 lg:grid-cols-[1fr_2fr]">
        <Section title="About this capability">
          <p className="leading-relaxed">{cap.description}</p>
          {cap.typicalUses.length > 0 && (
            <>
              <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Typical uses</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {cap.typicalUses.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </>
          )}
          {cap.verificationStatus === 'unverified' && (
            <p className="mt-6 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
              This description has not been verified by an admin. Treat it as orientation only and rely on official documentation for product facts.
            </p>
          )}
        </Section>
        <Section title={`Demos using ${cap.shortName}`} description="How each demo uses this capability, according to its catalog mapping.">
          {matches.length ? (
            <ul className="flex flex-col gap-4" data-testid="capability-demos">
              {matches.map(({ demo, mapping }) => (
                <li key={demo.slug} data-slug={demo.slug} className="rounded-xl border bg-background p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/demos/${demo.slug}`} className="text-lg font-semibold hover:underline">
                      {demo.title}
                    </Link>
                    <StatusBadge status={demo.status} />
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${mapping.verified ? 'bg-leaf/20 text-foreground' : 'bg-surface text-muted-foreground'}`}>
                      {mapping.verified ? 'Verified mapping' : 'Unverified mapping'}
                    </span>
                  </div>
                  <dl className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                    <div>
                      <dt className="font-semibold">Why used</dt>
                      <dd className="text-muted-foreground">{mapping.whyUsed}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Where implemented</dt>
                      <dd className="text-muted-foreground">{mapping.implementationLocation ?? 'Awaiting repository reference'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Business value</dt>
                      <dd className="text-muted-foreground">{mapping.businessValue ?? '—'}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No demos mapped yet" description="No catalog entry currently maps to this capability." />
          )}
        </Section>
      </Container>
    </>
  )
}
