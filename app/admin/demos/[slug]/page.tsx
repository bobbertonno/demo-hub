import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AccessState } from '@/components/admin/access-state'
import { AdminShell } from '@/components/admin/admin-shell'
import { AuditTable } from '@/components/admin/audit-table'
import { DemoEditor } from '@/components/admin/demo-editor'
import { listAudit, type AuditEntry } from '@/lib/audit'
import { checkPageRole } from '@/lib/auth/session'
import { getCatalogMode, getDemoBySlug } from '@/lib/catalog/repository'
import { DemoInput } from '@/lib/schemas/manifest'
import { isObjectStorageConfigured } from '@/lib/storage/assets'

export const metadata: Metadata = { title: 'Edit demo', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function EditDemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const access = await checkPageRole('contributor')
  if (!access.ok) return <AccessState reason={access.reason} path={`/admin/demos/${slug}`} />
  const demo = await getDemoBySlug(slug)
  if (!demo) notFound()

  const mode = getCatalogMode()
  const isAdmin = access.user.role === 'admin'
  const { sync, createdAt: _c, updatedAt: _u, ...rest } = demo
  const initial = DemoInput.parse(rest)
  let history: AuditEntry[] = []
  if (isAdmin && mode === 'database') {
    try {
      history = await listAudit({ targetId: slug, limit: 30 })
    } catch {
      history = []
    }
  }

  return (
    <AdminShell user={access.user} mode={mode} active="" title={demo.title} description={isAdmin ? 'Edit, preview, publish or archive this catalog entry.' : 'Your changes will be submitted as a proposal.'}>
      <DemoEditor
        initial={initial}
        isNew={false}
        isAdmin={isAdmin}
        writable={mode === 'database'}
        canUpload={isAdmin && mode === 'database' && isObjectStorageConfigured()}
        sync={{ status: sync.status, lastSuccessAt: sync.lastSuccessAt, lastError: sync.lastError }}
      />
      {isAdmin ? (
        <section aria-labelledby="history-heading" className="mt-12">
          <h2 id="history-heading" className="text-xl font-semibold text-foreground">
            Audit history for this demo
          </h2>
          <div className="mt-4">
            <AuditTable entries={history} emptyLabel={mode === 'seed' ? 'Audit logs are unavailable in seed mode.' : undefined} />
          </div>
        </section>
      ) : null}
    </AdminShell>
  )
}
