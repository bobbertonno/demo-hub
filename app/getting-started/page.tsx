import type { Metadata } from 'next'
import Link from 'next/link'
import { CodeSnippet } from '@/components/shared/code-snippet'
import { Container, PageHero, Section } from '@/components/shared/page'
import { requireBrowseAccess } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Getting started' }

const PREREQS = [
  { name: 'Git', check: 'git --version', why: 'Clone each demo from its own repository.' },
  { name: 'Node.js (LTS)', check: 'node --version', why: 'Most JavaScript demos; confirm the exact version in each README.' },
  { name: 'Docker', check: 'docker --version', why: 'Local MongoDB or supporting services where a demo provides compose files.' },
  { name: 'MongoDB Shell', check: 'mongosh --version', why: 'Optional; useful to inspect data and verify connectivity.' },
]

export default async function GettingStartedPage() {
  await requireBrowseAccess('/getting-started')
  return (
    <>
      <PageHero
        eyebrow="Onboarding"
        title="Run any demo from the catalog"
        description="A common workflow for colleagues. Every demo has its own repository and README; when a demo page and this guide differ, the demo's verified repository instructions win."
      />
      <Container className="flex flex-col gap-14 py-12">
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm leading-relaxed">
          <strong>Generic template guidance.</strong> The commands on this page are general Git, Docker and MongoDB workflow examples. They are not demo-specific setup steps. Use the Local Mode and Atlas Connected Mode tabs on each demo page for repository-specific instructions.
        </div>

        <Section id="prerequisites" title="1. Prerequisites" description="Check that your tools are installed. Version requirements vary per demo.">
          <ul className="grid gap-4 md:grid-cols-2">
            {PREREQS.map((p) => (
              <li key={p.name} className="flex flex-col gap-3 rounded-xl border bg-background p-5">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{p.why}</p>
                </div>
                <CodeSnippet code={p.check} label={`Check ${p.name}`} />
              </li>
            ))}
          </ul>
        </Section>

        <Section id="clone" title="2. Clone the demo repository" description="Use the repository URL and branch or tag shown on the demo page. Private repositories require access granted by the maintainer.">
          <CodeSnippet code={'git clone <repository-url>\ncd <repository-directory>\ngit checkout <branch-or-tag>'} label="Clone template" />
        </Section>

        <Section id="env" title="3. Configure the environment" description="Demos read configuration from environment files. Never commit them.">
          <div className="grid gap-6 lg:grid-cols-2">
            <CodeSnippet code={'# Copy the example file if the repository provides one\ncp .env.example .env.local'} label="Environment template" />
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
              <li>Read the configuration reference on the demo page for each variable and whether it is secret.</li>
              <li>Keep secrets in local env files, a password manager or your platform secret store.</li>
              <li>Confirm the repository&apos;s <code>.gitignore</code> excludes env files before adding values.</li>
            </ul>
          </div>
        </Section>

        <div className="grid gap-8 lg:grid-cols-2">
          <Section id="local" title="4a. Local Demo Mode" description="Runs without your Atlas organization, using a local MongoDB container or the demo's simulated data.">
            <CodeSnippet code={'# Example: a disposable local MongoDB\ndocker run -d --name mongodb-demo -p 27017:27017 mongodb/mongodb-community-server:latest'} label="Local MongoDB (template)" />
            <p className="mt-3 text-sm text-muted-foreground">Atlas-only features such as Atlas Search, Vector Search or Stream Processing may be unavailable or emulated locally. Each demo documents its own limitations.</p>
          </Section>
          <Section id="atlas" title="4b. Atlas Connected Mode" description="Connect the demo to a project in your own Atlas organization.">
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
              <li>Create or choose a dedicated demo project and cluster in Atlas.</li>
              <li>Create a database user with the least privileges the demo requires.</li>
              <li>Add your current IP to the project IP access list. Avoid <code>0.0.0.0/0</code>.</li>
              <li>Copy the connection string and set it as the demo&apos;s documented variable.</li>
              <li>Create search or vector indexes exactly as the demo README describes.</li>
            </ol>
            <div className="mt-4">
              <CodeSnippet code={'mongosh "<your-atlas-connection-string>" --eval "db.runCommand({ ping: 1 })"'} label="Connectivity check (template)" />
            </div>
          </Section>
        </div>

        <Section id="hygiene" title="5. Credential hygiene">
          <ul className="grid gap-4 md:grid-cols-3">
            {[
              { t: 'Never share connection strings', b: 'Do not paste credentials into chat, tickets, screenshots or slides.' },
              { t: 'Use disposable users', b: 'Create demo-specific database users and delete them after customer sessions.' },
              { t: 'Rotate after exposure', b: 'If a secret leaks, rotate it in Atlas immediately and revoke the old user.' },
            ].map((x) => (
              <li key={x.t} className="rounded-xl border bg-background p-5">
                <p className="font-semibold">{x.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{x.b}</p>
              </li>
            ))}
          </ul>
        </Section>

        <p className="text-sm">
          Ready? <Link href="/demos" className="font-semibold text-accent hover:underline">Browse the catalog</Link> and pick a demo.
        </p>
      </Container>
    </>
  )
}
