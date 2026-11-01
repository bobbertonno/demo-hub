import type { Metadata } from 'next'
import { AccessState } from '@/components/admin/access-state'
import { AdminShell } from '@/components/admin/admin-shell'
import { DiagnosticsList } from '@/components/admin/diagnostics-list'
import { SyncButton } from '@/components/admin/sync-button'
import { formatDateTime } from '@/components/shared/page'
import { checkPageRole } from '@/lib/auth/session'
import { getDiagnostics, githubAuthMode } from '@/lib/config/env'
import { getCatalogMode, listDemos } from '@/lib/catalog/repository'
import { listSyncJobs } from '@/lib/github/sync'
import type { SyncJob } from '@/lib/github/types'

export const metadata: Metadata = { title: 'Integrations', robots: { index: false } }
export const dynamic = 'force-dynamic'

const GITHUB_KEYS = ['github', 'githubApp', 'githubToken', 'githubWebhook', 'cronSecret', 'blob']

export default async function IntegrationsPage() {
  const access = await checkPageRole('admin')
  if (!access.ok) return <AccessState reason={access.reason} path="/admin/integrations" />
  const mode = getCatalogMode()
  const authMode = githubAuthMode()
  const diagnostics = getDiagnostics()
  const relevant = diagnostics.filter((d) => GITHUB_KEYS.some((k) => d.key.toLowerCase().includes(k.toLowerCase())))
  const { data: demos } = await listDemos({ includeArchived: true })
  let jobs: SyncJob[] = []
  let jobsError: string | null = null
  if (mode === 'database') {
    try {
      jobs = await listSyncJobs(30)
    } catch {
      jobsError = 'Could not load synchronization jobs from MongoDB.'
    }
  }
  const lastSuccess = demos
    .map((d) => d.sync.lastSuccessAt)
    .filter((v): v is string => Boolean(v))
    .sort()
    .at(-1)

  return (
    <AdminShell user={access.user} mode={mode} active="/admin/integrations" title="GitHub integration" description="Synchronize README, demo.yaml, docs and assets from each demo's own repository. Content is cached in MongoDB; pages never call GitHub on render.">
      <dl className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5">
          <dt className="text-sm text-muted-foreground">Credentials</dt>
          <dd className="mt-1 text-xl font-semibold text-foreground">{authMode === 'app' ? 'GitHub App' : authMode === 'token' ? 'Fine-grained token' : 'Not configured'}</dd>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <dt className="text-sm text-muted-foreground">Last successful sync</dt>
          <dd className="mt-1 text-xl font-semibold text-foreground">{lastSuccess ? formatDateTime(lastSuccess) : 'Never'}</dd>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <dt className="text-sm text-muted-foreground">Repositories registered</dt>
          <dd className="mt-1 text-xl font-semibold text-foreground">
            {demos.filter((d) => d.repository).length} / {demos.length}
          </dd>
        </div>
      </dl>

      {authMode === 'none' ? (
        <p role="status" className="mt-6 rounded-lg border border-border bg-surface p-4 text-sm leading-relaxed text-foreground">
          GitHub is not connected. Configure a least-privilege GitHub App (<code className="font-mono">GITHUB_APP_ID</code>, <code className="font-mono">GITHUB_PRIVATE_KEY</code>, <code className="font-mono">GITHUB_APP_INSTALLATION_ID</code>) with read-only
          Contents and Metadata permissions, or a fine-grained read-only token. Public repositories can still be read unauthenticated at a lower rate limit.
        </p>
      ) : null}

      <section aria-labelledby="repos-heading" className="mt-10">
        <h2 id="repos-heading" className="text-xl font-semibold text-foreground">
          Repository status
        </h2>
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
          {demos.map((d) => (
            <li key={d.slug} className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{d.title}</p>
                <p className="truncate text-sm text-muted-foreground">{d.repository ?? 'No repository URL registered — sync unavailable'}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Status <span className="font-semibold text-foreground">{d.sync.status}</span>
                  {d.sync.lastAttemptAt ? ` · last attempt ${formatDateTime(d.sync.lastAttemptAt)}` : ''}
                  {d.sync.lastSuccessAt ? ` · last success ${formatDateTime(d.sync.lastSuccessAt)}` : ''}
                  {d.sync.commitSha ? ` · ${d.sync.commitSha.slice(0, 7)}` : ''}
                </p>
                {d.sync.lastError ? (
                  <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {d.sync.lastError}
                  </p>
                ) : null}
              </div>
              <SyncButton slug={d.slug} disabled={!d.repository || mode !== 'database'} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="jobs-heading" className="mt-10">
        <h2 id="jobs-heading" className="text-xl font-semibold text-foreground">
          Recent sync jobs
        </h2>
        {jobsError ? (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {jobsError}
          </p>
        ) : jobs.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{mode === 'seed' ? 'Sync jobs are recorded in MongoDB and unavailable in seed mode.' : 'No synchronization jobs yet.'}</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {['Started', 'Demo', 'Trigger', 'Status', 'Requests', 'Error'].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jobs.map((j) => (
                  <tr key={j.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDateTime(j.startedAt)}</td>
                    <td className="px-4 py-3 text-foreground">{j.demoSlug}</td>
                    <td className="px-4 py-3 text-foreground">{j.trigger}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{j.status}</td>
                    <td className="px-4 py-3 text-muted-foreground">{j.requests}</td>
                    <td className="max-w-sm px-4 py-3 text-xs text-muted-foreground">{j.error ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="config-heading" className="mt-10">
        <h2 id="config-heading" className="text-xl font-semibold text-foreground">
          Credential configuration
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Presence only — secret values are never sent to the browser. Scheduled sync: <code className="font-mono">POST /api/sync/scheduled</code> with <code className="font-mono">Authorization: Bearer $CRON_SECRET</code>. Webhook: <code className="font-mono">POST /api/github/webhook</code>, verified with HMAC-SHA256.
        </p>
        <div className="mt-4">
          <DiagnosticsList items={relevant.length ? relevant : diagnostics} />
        </div>
      </section>
    </AdminShell>
  )
}
