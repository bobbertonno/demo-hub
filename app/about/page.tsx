import type { Metadata } from 'next'
import { CodeSnippet } from '@/components/shared/code-snippet'
import { Container, PageHero, Section } from '@/components/shared/page'
import { requireBrowseAccess } from '@/lib/auth/session'
import { getSettings } from '@/lib/catalog/settings'

export const metadata: Metadata = { title: 'About' }

const MANIFEST_EXAMPLE = `id: my-demo
slug: my-demo
title: My Demo
summary: One-paragraph description.
businessProblem: The customer problem this demo addresses.
industry: Financial Services
capabilities:
  - capability: vector-search
    whyUsed: Semantic retrieval over documents.
    implementationLocation: src/search/vector.ts
repository: https://github.com/<org>/<repo>
defaultBranch: main
readmePath: README.md
demoModes: [local-demo, atlas-connected]
themeMode: mongodb
maintainer: { name: Your Name, team: Solutions Architecture }
maturity: prototype
documentationStatus: partial
verificationTimestamp: null
releaseVersion: null`

export default async function AboutPage() {
  await requireBrowseAccess('/about')
  const settings = await getSettings()
  return (
    <>
      <PageHero
        eyebrow="About"
        title="A shared home for Solutions Architect demos"
        description="The Hub documents and distributes demos. It never runs, deploys or modifies them."
      />
      <Container className="flex flex-col gap-14 py-12">
        <Section id="purpose" title="Purpose">
          <p className="max-w-3xl leading-relaxed">
            Demos live in independent GitHub repositories owned by their maintainers. The Hub caches each repository&apos;s README and optional <code>demo.yaml</code> in MongoDB, adds business context and capability mapping, and presents copyable setup steps that are clearly labeled as verified from the repository or as unverified templates.
          </p>
        </Section>

        <Section id="contribute" title="Contribution process">
          <ol className="grid gap-4 md:grid-cols-4">
            {[
              { t: 'Prepare the repository', b: 'Add a complete README with local and Atlas instructions, plus an optional demo.yaml.' },
              { t: 'Propose the entry', b: 'Contributors submit a catalog proposal from the admin area.' },
              { t: 'Review', b: 'An admin reviews the proposal, synchronizes the repository and previews the page.' },
              { t: 'Publish', b: 'Admins publish. Every change is recorded in the audit log.' },
            ].map((s, i) => (
              <li key={s.t} className="rounded-xl border bg-background p-5">
                <p className="text-sm font-semibold text-accent">Step {i + 1}</p>
                <p className="mt-1 font-semibold">{s.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.b}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="manifest" title="demo.yaml manifest" description="Place it at the repository root. The Hub validates it with Zod and flags conflicts with catalog metadata instead of overwriting either side.">
          <CodeSnippet code={MANIFEST_EXAMPLE} language="yaml" label="demo.yaml (example)" />
        </Section>

        <Section id="governance" title="Governance">
          <dl className="grid gap-4 md:grid-cols-3">
            {[
              { t: 'Viewer', b: 'Browse the catalog and documentation.' },
              { t: 'Contributor', b: 'Propose new demos and changes to catalog metadata.' },
              { t: 'Admin', b: 'Approve, edit, synchronize, publish, archive and manage settings.' },
            ].map((r) => (
              <div key={r.t} className="rounded-xl border bg-background p-5">
                <dt className="font-semibold">{r.t}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{r.b}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-muted-foreground">
            The Hub never pushes to demo repositories. Suggested README updates are offered as downloadable patches for maintainers to review.
          </p>
        </Section>

        <Section id="maintainers" title="Maintainers">
          <p className="text-sm">
            Hub support: <span className="font-medium">{settings.appearance.supportContact}</span>. Each demo lists its own maintainer on its detail page.
          </p>
        </Section>
      </Container>
    </>
  )
}
