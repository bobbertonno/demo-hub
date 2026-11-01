import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AtlasInfiniteExperience } from '@/components/demos/atlas-infinite/atlas-infinite-experience'
import { ArchitecturePanel } from '@/components/demos/detail/architecture-panel'
import { CapabilityMatrix } from '@/components/demos/detail/capability-matrix'
import { RepositoryPanel } from '@/components/demos/detail/repository-panel'
import { ScreenshotGallery } from '@/components/demos/detail/screenshot-gallery'
import { SetupTabs } from '@/components/demos/detail/setup-tabs'
import { CodeSnippet } from '@/components/shared/code-snippet'
import { Container, KeyValue, Section, formatDate, formatDateTime } from '@/components/shared/page'
import { DocStatusBadge, MaturityBadge, StatusBadge, ThemeModeBadge } from '@/components/shared/status-badges'
import { hasRole } from '@/lib/auth/roles'
import { requireBrowseAccess } from '@/lib/auth/session'
import { getDemoBySlug, getLatestSnapshot } from '@/lib/catalog/repository'
import { RUNTIME_LABELS } from '@/lib/seed/capability-labels'

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const demo = await getDemoBySlug(slug)
  return demo ? { title: demo.title, description: demo.tagline ?? demo.summary } : { title: 'Demo not found' }
}

const SECTIONS = [
  ['overview', 'Overview'],
  ['walkthrough', 'Walkthrough'],
  ['architecture', 'Architecture'],
  ['capabilities', 'Capabilities'],
  ['gallery', 'Gallery'],
  ['setup', 'Setup'],
  ['configuration', 'Configuration'],
  ['readme', 'README'],
  ['troubleshooting', 'Troubleshooting'],
  ['faq', 'FAQ'],
  ['ownership', 'Ownership'],
] as const

export default async function DemoDetailPage({ params }: Params) {
  const { slug } = await params
  const { user } = await requireBrowseAccess(`/demos/${slug}`)
  const demo = await getDemoBySlug(slug)
  if (!demo || (demo.status === 'archived' && !hasRole(user?.role, 'contributor'))) notFound()
  const snapshot = await getLatestSnapshot(slug)
  const canEdit = hasRole(user?.role, 'admin')

  const repoSetup = snapshot?.status === 'ok' ? snapshot.setup : null
  const localSteps = repoSetup?.local.length ? repoSetup.local : demo.localSetup
  const atlasSteps = repoSetup?.atlas.length ? repoSetup.atlas : demo.atlasSetup
  const repoBlobBase = demo.repository ? `${demo.repository.replace(/\/$/, '')}/blob/${snapshot?.ref ?? demo.defaultBranch}` : null
  const accent = demo.themeMode !== 'mongodb' ? demo.customerTheme?.primaryColor : undefined

  return (
    <>
      <section className="bg-hero text-hero-foreground">
        <Container className="py-12 md:py-16">
          <nav aria-label="Breadcrumb" className="text-sm text-white/60">
            <Link href="/demos" className="hover:text-leaf">Demos</Link> <span aria-hidden>/</span> <span>{demo.title}</span>
          </nav>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <StatusBadge status={demo.status} />
            <MaturityBadge maturity={demo.maturity} />
            <DocStatusBadge status={demo.documentationStatus} />
            <ThemeModeBadge mode={demo.themeMode} customerName={demo.customerTheme?.name} />
          </div>
          <h1 className="mt-4 text-balance text-4xl font-semibold md:text-5xl">{demo.title}</h1>
          {demo.tagline && <p className="mt-4 max-w-3xl text-pretty text-lg text-white/75">{demo.tagline}</p>}
          <dl className="mt-8 grid max-w-4xl grid-cols-2 gap-x-8 gap-y-4 text-sm md:grid-cols-4">
            <div><dt className="text-white/55">Category</dt><dd className="mt-1 font-medium">{demo.category ?? demo.industry}</dd></div>
            <div><dt className="text-white/55">Maintainer</dt><dd className="mt-1 font-medium">{demo.maintainer.name}</dd></div>
            <div><dt className="text-white/55">Version</dt><dd className="mt-1 font-medium">{demo.releaseVersion ?? 'Unreleased'}</dd></div>
            <div><dt className="text-white/55">Updated</dt><dd className="mt-1 font-medium">{formatDate(demo.updatedAt)}</dd></div>
          </dl>
          {canEdit && (
            <Link href={`/admin/demos/${demo.slug}`} className="mt-8 inline-block rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/10">
              Edit in admin
            </Link>
          )}
        </Container>
      </section>

      <Container className="grid gap-10 py-10 lg:grid-cols-[13rem_1fr]">
        <nav aria-label="On this page" className="hidden lg:block">
          <ul className="sticky top-24 flex flex-col gap-1 text-sm">
            {SECTIONS.map(([id, label]) => (
              <li key={id}><a href={`#${id}`} className="block rounded px-2 py-1 text-muted-foreground hover:bg-surface hover:text-foreground">{label}</a></li>
            ))}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-14">
          {demo.status !== 'published' && (
            <p role="note" className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100">
              This entry is a <strong>{demo.status.replace('_', ' ')}</strong>. Content is pending verification against the real repository.
            </p>
          )}

          <Section id="overview" title="Overview">
            <div className="grid gap-8 md:grid-cols-2">
              <div><h3 className="font-semibold">Business challenge</h3><p className="mt-2 leading-relaxed text-muted-foreground">{demo.businessProblem}</p></div>
              <div><h3 className="font-semibold">Solution & value</h3><p className="mt-2 leading-relaxed text-muted-foreground">{demo.solution ?? demo.summary}</p></div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {demo.demoModes.map((m) => <span key={m} className="rounded-full border px-3 py-1 text-xs">{RUNTIME_LABELS[m]}</span>)}
              {demo.tags.map((t) => <span key={t} className="rounded-full bg-surface px-3 py-1 text-xs text-muted-foreground">#{t}</span>)}
            </div>
            {demo.themeMode !== 'mongodb' && demo.customerTheme && (
              <div className="mt-6 flex items-center gap-3 rounded-lg border p-4 text-sm" data-testid="customer-theme">
                <span aria-hidden className="size-6 rounded" style={{ background: accent ?? 'transparent' }} />
                <span>Demo previews use the <strong>{demo.customerTheme.name}</strong> theme ({demo.themeMode}). The Hub itself always uses LeafyGreen.</span>
              </div>
            )}
          </Section>

          {demo.interactiveExperience === 'atlas-infinite' && (
            <Section id="interactive" title="Interactive explorer" description="Separate illustrative assumptions from measured results.">
              <AtlasInfiniteExperience facts={demo.facts} />
            </Section>
          )}

          <Section id="walkthrough" title="Functional walkthrough">
            {demo.walkthrough.length ? (
              <ol className="list-decimal space-y-2 pl-5 leading-relaxed">{demo.walkthrough.map((w, i) => <li key={i}>{w}</li>)}</ol>
            ) : <p className="text-muted-foreground">Not documented yet.</p>}
            {demo.userJourney && <div className="mt-6 rounded-xl bg-surface p-5"><h3 className="font-semibold">Example user journey</h3><p className="mt-2 leading-relaxed text-muted-foreground">{demo.userJourney}</p></div>}
          </Section>

          <Section id="architecture" title="Architecture & data flow">
            {demo.architecture.overview && <p className="leading-relaxed text-muted-foreground">{demo.architecture.overview}</p>}
            {demo.architecture.dataFlow.length > 0 && (
              <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm">{demo.architecture.dataFlow.map((f, i) => <li key={i}>{f}</li>)}</ol>
            )}
            <div className="mt-6 flex flex-col gap-6">
              {demo.architecture.diagrams.map((d) => <ArchitecturePanel key={d.id} diagram={d} editHref={canEdit ? `/admin/demos/${demo.slug}#diagrams` : undefined} />)}
            </div>
          </Section>

          <Section id="capabilities" title="MongoDB capability mapping">
            <CapabilityMatrix capabilities={demo.capabilities} />
          </Section>

          <Section id="gallery" title="Screenshot gallery">
            <ScreenshotGallery screenshots={demo.screenshots} />
          </Section>

          <Section id="setup" title="Run this demo">
            <div className="grid gap-8 xl:grid-cols-[1fr_22rem]">
              <div className="flex min-w-0 flex-col gap-8">
                {demo.prerequisites.length > 0 && (
                  <div>
                    <h3 className="font-semibold">Prerequisites</h3>
                    <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                      {demo.prerequisites.map((p) => (
                        <li key={p.name} className="rounded-lg border p-3 text-sm">
                          <p className="font-medium">{p.name}{p.version && <span className="text-muted-foreground"> {p.version}</span>}</p>
                          {p.check && <div className="mt-2"><CodeSnippet code={p.check} language="bash" label={`Check ${p.name}`} /></div>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <SetupTabs local={localSteps} atlas={atlasSteps} supportsLocal={demo.demoModes.some((m) => m !== 'atlas-connected')} supportsAtlas={demo.demoModes.some((m) => m === 'atlas-connected' || m === 'hybrid')} repoBlobBase={repoBlobBase} />
                {demo.setupWizard && <div className="rounded-xl bg-surface p-5"><h3 className="font-semibold">Setup wizard</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{demo.setupWizard}</p></div>}
              </div>
              <aside className="flex flex-col gap-4">
                <h3 className="font-semibold">Repository</h3>
                <RepositoryPanel slug={demo.slug} repository={demo.repository} defaultBranch={demo.defaultBranch} />
                {demo.repositoryFiles.length > 0 && repoBlobBase && (
                  <ul className="flex flex-col gap-1 text-sm">
                    {demo.repositoryFiles.map((f) => <li key={f.path}><a href={`${repoBlobBase}/${f.path}`} target="_blank" rel="noreferrer" className="text-accent hover:underline">{f.label}</a></li>)}
                  </ul>
                )}
              </aside>
            </div>
          </Section>

          <Section id="configuration" title="Configuration reference">
            {demo.configuration.length ? (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface"><tr><th className="p-3">Variable</th><th className="p-3">Description</th><th className="p-3">Required</th><th className="p-3">Modes</th></tr></thead>
                  <tbody>
                    {demo.configuration.map((c) => (
                      <tr key={c.name} className="border-t align-top">
                        <td className="p-3"><code>{c.name}</code>{c.secret && <span className="ml-2 rounded bg-red-100 px-1.5 text-xs text-red-800 dark:bg-red-950 dark:text-red-200">secret</span>}</td>
                        <td className="p-3 text-muted-foreground">{c.description}{c.example && !c.secret && <> Example: <code>{c.example}</code></>}</td>
                        <td className="p-3">{c.required ? 'Yes' : 'No'}</td>
                        <td className="p-3 text-xs">{c.modes.map((m) => RUNTIME_LABELS[m]).join(', ') || 'All'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-muted-foreground">Awaiting verified repository instructions.</p>}
          </Section>

          <Section id="readme" title="README preview" description={snapshot ? `Synchronized ${formatDateTime(snapshot.fetchedAt)} from ${snapshot.ref}${snapshot.commitSha ? ` @ ${snapshot.commitSha.slice(0, 7)}` : ''}` : undefined}>
            {demo.sync.status === 'error' && snapshot && (
              <p role="alert" className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100">
                Last sync failed ({demo.sync.lastError}). Showing the last successful snapshot.
              </p>
            )}
            {snapshot && !snapshot.readme.missing ? (
              <div className="markdown-body rounded-xl border p-6" dangerouslySetInnerHTML={{ __html: snapshot.readme.html }} />
            ) : (
              <div className="rounded-xl border border-dashed bg-surface p-8 text-center" data-testid="readme-missing">
                <p className="font-semibold">{snapshot?.readme.missing ? 'README not found in repository' : 'Documentation not yet synchronized'}</p>
                <p className="mt-1 text-sm text-muted-foreground">{demo.repository ? 'An admin can trigger a sync from the admin integrations page.' : 'Register the repository URL to synchronize its README.'}</p>
              </div>
            )}
          </Section>

          <Section id="troubleshooting" title="Troubleshooting, limitations & security">
            <div className="grid gap-6 md:grid-cols-3">
              <div><h3 className="font-semibold">Troubleshooting</h3>{demo.troubleshooting.length ? <dl className="mt-2 space-y-3 text-sm">{demo.troubleshooting.map((t) => <div key={t.question}><dt className="font-medium">{t.question}</dt><dd className="text-muted-foreground">{t.answer}</dd></div>)}</dl> : <p className="mt-2 text-sm text-muted-foreground">None documented.</p>}</div>
              <div><h3 className="font-semibold">Limitations</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{demo.limitations.map((l) => <li key={l}>{l}</li>)}</ul></div>
              <div><h3 className="font-semibold">Security notes</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{demo.securityNotes.map((l) => <li key={l}>{l}</li>)}</ul></div>
            </div>
          </Section>

          <Section id="faq" title="FAQ">
            {demo.faq.length ? (
              <div className="flex flex-col divide-y rounded-xl border">
                {demo.faq.map((f) => <details key={f.question} className="group p-4"><summary className="cursor-pointer font-medium">{f.question}</summary><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.answer}</p></details>)}
              </div>
            ) : <p className="text-muted-foreground">No FAQ yet.</p>}
          </Section>

          <Section id="ownership" title="Ownership & contribution">
            <dl className="grid gap-4 sm:grid-cols-3">
              <KeyValue label="Maintainer">{demo.maintainer.name}{demo.maintainer.team ? ` · ${demo.maintainer.team}` : ''}</KeyValue>
              <KeyValue label="Last verified">{demo.verificationTimestamp ? formatDateTime(demo.verificationTimestamp) : 'Not verified'}</KeyValue>
              <KeyValue label="Last sync">{demo.sync.lastSuccessAt ? formatDateTime(demo.sync.lastSuccessAt) : 'Never'}</KeyValue>
            </dl>
            {demo.contributionGuide && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{demo.contributionGuide}</p>}
          </Section>
        </div>
      </Container>
    </>
  )
}
