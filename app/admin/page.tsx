import type { Metadata } from 'next'
import Link from 'next/link'
import { AccessState } from '@/components/admin/access-state'
import { AdminShell } from '@/components/admin/admin-shell'
import { AuditTable } from '@/components/admin/audit-table'
import { InitializeCatalog } from '@/components/admin/initialize-catalog'
import { ProposalActions } from '@/components/admin/proposal-actions'
import { formatDateTime } from '@/components/shared/page'
import { StatusBadge } from '@/components/shared/status-badges'
import { listAudit, type AuditEntry } from '@/lib/audit'
import { checkPageRole } from '@/lib/auth/session'
import { getCatalogMode, listDemos } from '@/lib/catalog/repository'
import { listProposals, type ChangeProposal } from '@/lib/catalog/proposals'

export const metadata: Metadata = { title: 'Admin dashboard', robots: { index: false } }
export const dynamic = 'force-dynamic'

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch {
    return fallback
  }
}

export default async function AdminDashboardPage() {
  const access = await checkPageRole('contributor')
  if (!access.ok) return <AccessState reason={access.reason} path="/admin" />
  const { user } = access
  const isAdmin = user.role === 'admin'
  const mode = getCatalogMode()

  const [{ data: demos, degraded }, proposals, audit] = await Promise.all([
    listDemos({ includeArchived: true }),
    mode === 'database' ? safe<ChangeProposal[]>(() => listProposals('pending'), []) : Promise.resolve([] as ChangeProposal[]),
    isAdmin && mode === 'database' ? safe<AuditEntry[]>(() => listAudit({ limit: 25 }), []) : Promise.resolve([] as AuditEntry[]),
  ])
  const visibleProposals = isAdmin ? proposals : proposals.filter((p) => p.proposedBy === user.email)

  const counts = {
    total: demos.length,
    published: demos.filter((d) => d.status === 'published').length,
    draft: demos.filter((d) => d.status === 'draft' || d.status === 'in_review').length,
    syncErrors: demos.filter((d) => d.sync.status === 'error' || d.sync.status === 'stale').length,
  }

  return (
    <AdminShell
      user={user}
      mode={mode}
      active="/admin"
      title="Catalog dashboard"
      description={isAdmin ? 'Create, review, synchronize and publish demo catalog entries.' : 'As a contributor, your edits are submitted as proposals for admin review.'}
      actions={
        <Link href="/admin/demos/new" className="rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-forest hover:bg-mint">
          Register a demo
        </Link>
      }
    >
      {isAdmin && mode === 'database' ? <InitializeCatalog empty={demos.length === 0} /> : null}
      {degraded ? (
        <p role="alert" className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-foreground">
          {degraded}
        </p>
      ) : null}

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['Demos', counts.total],
          ['Published', counts.published],
          ['Draft / in review', counts.draft],
          ['Sync warnings', counts.syncErrors],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-5">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-3xl font-semibold text-foreground">{value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="demos-heading" className="mt-10">
        <h2 id="demos-heading" className="text-xl font-semibold text-foreground">
          Demos
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Demo
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Repository
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  GitHub sync
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Updated
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {demos.map((d) => (
                <tr key={d.slug} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{d.title}</p>
                    <p className="text-xs text-muted-foreground">{d.category ?? d.industry}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{d.repository ? d.repository.replace('https://github.com/', '') : 'Awaiting repository URL'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="font-medium text-foreground">{d.sync.status}</span>
                    {d.sync.lastSuccessAt ? <span className="block text-xs">Last success {formatDateTime(d.sync.lastSuccessAt)}</span> : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDateTime(d.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <Link href={`/demos/${d.slug}`} className="font-medium text-accent underline-offset-4 hover:underline">
                        View
                      </Link>
                      <Link href={`/admin/demos/${d.slug}`} className="font-medium text-accent underline-offset-4 hover:underline">
                        {isAdmin ? 'Edit' : 'Propose edit'}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="proposals-heading" className="mt-10">
        <h2 id="proposals-heading" className="text-xl font-semibold text-foreground">
          {isAdmin ? 'Pending proposals' : 'Your pending proposals'}
        </h2>
        {mode === 'seed' ? (
          <p className="mt-3 text-sm text-muted-foreground">Proposals require a MongoDB database.</p>
        ) : visibleProposals.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No pending proposals.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {visibleProposals.map((p) => (
              <li key={p.id} className="flex flex-col gap-3 rounded-xl border border-border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-foreground">
                    {p.kind === 'create' ? 'New demo' : 'Edit'}: {p.payload.title ?? p.demoSlug}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {p.proposedBy} · {formatDateTime(p.createdAt)}
                    {p.note ? ` · ${p.note}` : ''}
                  </p>
                </div>
                {isAdmin ? <ProposalActions id={p.id} /> : <span className="text-sm text-muted-foreground">Awaiting admin review</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {isAdmin ? (
        <section aria-labelledby="audit-heading" className="mt-10">
          <h2 id="audit-heading" className="text-xl font-semibold text-foreground">
            Recent audit history
          </h2>
          <div className="mt-4">
            <AuditTable entries={audit} emptyLabel={mode === 'seed' ? 'Audit logs are stored in MongoDB and unavailable in seed mode.' : undefined} />
          </div>
        </section>
      ) : null}
    </AdminShell>
  )
}
