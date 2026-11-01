import Link from 'next/link'
import { DemoCard } from '@/components/demos/demo-card'
import { Container, Section } from '@/components/shared/page'
import { requireBrowseAccess } from '@/lib/auth/session'
import { getVisibleDemos } from '@/lib/catalog/visible'
import { seedCapabilities } from '@/lib/seed/capabilities'

const QUICK_LINKS = [
  { href: '/getting-started', title: 'Getting started', body: 'Prerequisites, git clone, environment hygiene and Atlas connectivity.' },
  { href: '/architectures', title: 'Architecture gallery', body: 'Mermaid diagrams with explanations, full-screen and side-by-side comparison.' },
  { href: '/capabilities', title: 'Capability explorer', body: 'Find demos by MongoDB capability and see exactly how each one is used.' },
  { href: '/about', title: 'Contribute a demo', body: 'Governance, demo.yaml manifest format and the review workflow.' },
]

export default async function HomePage() {
  await requireBrowseAccess('/')
  const { data: demos, mode } = await getVisibleDemos()
  const featured = demos.filter((d) => d.featured).slice(0, 4)
  const capabilityCount = new Set(demos.flatMap((d) => d.capabilities.map((c) => c.capability))).size

  return (
    <>
      <section className="relative overflow-hidden bg-hero text-hero-foreground">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(0,237,100,0.22),transparent_50%),radial-gradient(ellipse_at_0%_100%,rgba(113,246,186,0.10),transparent_45%)]" />
        <Container className="relative grid gap-12 py-16 md:py-24 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-leaf">Solutions Architect Edition</p>
            <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.1] md:text-6xl">
              Every MongoDB demo, documented and ready to share.
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-white/75">
              The internal catalog of reusable demos: repository links, architecture explanations, capability mapping and verified instructions to run each demo locally or against your own Atlas organization.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/demos" className="rounded-lg bg-leaf px-5 py-3 text-sm font-semibold text-forest hover:bg-[#71F6BA]">
                Browse the catalog
              </Link>
              <Link href="/getting-started" className="rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold hover:bg-white/10">
                Getting started
              </Link>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-4">
            {[
              { label: 'Demos in catalog', value: demos.length },
              { label: 'Capabilities covered', value: capabilityCount },
              { label: 'Reference capabilities', value: seedCapabilities.length },
              { label: 'Catalog source', value: mode === 'database' ? 'Atlas' : 'Seed' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <dt className="text-xs uppercase tracking-wide text-white/60">{s.label}</dt>
                <dd className="mt-2 text-3xl font-semibold text-leaf">{s.value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <Container className="flex flex-col gap-16 py-14">
        <Section
          id="featured"
          title="Featured demos"
          description="All seeded entries are drafts until their real GitHub repositories are registered and synchronized."
        >
          {featured.length ? (
            <div className="grid gap-6 md:grid-cols-2">
              {featured.map((d) => (
                <DemoCard key={d.slug} demo={d} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No featured demos yet.</p>
          )}
        </Section>

        <Section id="what" title="What the Hub does — and doesn't">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { t: 'Documents', b: 'Business context, architecture, capability mapping, screenshots and FAQs for each demo, cached from its repository.' },
              { t: 'Distributes', b: 'Links to each independent GitHub repository with README previews and copyable setup steps labeled verified or template.' },
              { t: 'Never executes', b: 'The Hub does not run, deploy or modify demos or infrastructure. You run demos locally or in your own Atlas organization.' },
            ].map((c) => (
              <div key={c.t} className="rounded-xl border bg-surface p-6">
                <h3 className="font-semibold">{c.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.b}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="quick-links" title="Quick links">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_LINKS.map((q) => (
              <li key={q.href}>
                <Link href={q.href} className="flex h-full flex-col rounded-xl border p-5 transition-colors hover:border-leaf-dark hover:bg-surface">
                  <span className="font-semibold">{q.title}</span>
                  <span className="mt-2 text-sm text-muted-foreground">{q.body}</span>
                  <span className="mt-4 text-sm font-semibold text-accent">Open →</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </Container>
    </>
  )
}
