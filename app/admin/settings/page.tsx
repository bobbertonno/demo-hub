import type { Metadata } from 'next'
import { AdminShell } from '@/components/admin/admin-shell'
import { DiagnosticsList } from '@/components/admin/diagnostics-list'
import { SettingsForm } from '@/components/admin/settings-form'
import { getCurrentUser } from '@/lib/auth/session'
import { getDiagnostics } from '@/lib/config/env'
import { getCatalogMode } from '@/lib/catalog/repository'
import { getSettings } from '@/lib/catalog/settings'

export const metadata: Metadata = { title: 'Settings', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const user = await getCurrentUser()
  const mode = getCatalogMode()
  const settings = await getSettings()

  return (
    <AdminShell user={user} mode={mode} active="/admin/settings" title="Catalog settings" description="Feature flags, appearance metadata and configuration diagnostics.">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-labelledby="catalog-heading">
          <h2 id="catalog-heading" className="mb-4 text-xl font-semibold text-foreground">
            Catalog
          </h2>
          <SettingsForm initial={settings} writable={mode === 'database'} />
        </section>

        <section aria-labelledby="diagnostics-heading" className="flex flex-col gap-4">
          <h2 id="diagnostics-heading" className="text-xl font-semibold text-foreground">
            Configuration diagnostics
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">The Hub runs in local mode without user accounts. Every visitor has full access, so run it only on a trusted machine or network.</p>
          <DiagnosticsList items={getDiagnostics()} />
        </section>
      </div>
    </AdminShell>
  )
}
