import type { Metadata } from 'next'
import { AccessState } from '@/components/admin/access-state'
import { AdminShell } from '@/components/admin/admin-shell'
import { DiagnosticsList } from '@/components/admin/diagnostics-list'
import { RolesManager } from '@/components/admin/roles-manager'
import { SettingsForm } from '@/components/admin/settings-form'
import { checkPageRole, listUserRoles } from '@/lib/auth/session'
import { allowedEmailDomains, getDiagnostics, isDevAuthEnabled, isSsoConfigured } from '@/lib/config/env'
import { getCatalogMode } from '@/lib/catalog/repository'
import { getSettings } from '@/lib/catalog/settings'

export const metadata: Metadata = { title: 'Settings', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const access = await checkPageRole('admin')
  if (!access.ok) return <AccessState reason={access.reason} path="/admin/settings" />
  const mode = getCatalogMode()
  const writable = mode === 'database'
  const [settings, roles] = await Promise.all([getSettings(), listUserRoles().catch(() => [])])
  const sso = isSsoConfigured()
  const domains = allowedEmailDomains()

  return (
    <AdminShell user={access.user} mode={mode} active="/admin/settings" title="Catalog settings" description="Feature flags, appearance metadata, access configuration and role assignments.">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-labelledby="catalog-heading">
          <h2 id="catalog-heading" className="mb-4 text-xl font-semibold text-foreground">
            Catalog
          </h2>
          <SettingsForm initial={settings} writable={writable} />
        </section>

        <section aria-labelledby="sso-heading" className="flex flex-col gap-4">
          <h2 id="sso-heading" className="text-xl font-semibold text-foreground">
            Single sign-on
          </h2>
          <div className="rounded-xl border border-border bg-surface p-5 text-sm leading-relaxed text-foreground">
            <p>
              <strong>OIDC provider:</strong> {sso ? 'Configured' : 'Not configured — protected routes deny access in production.'}
            </p>
            <p className="mt-1">
              <strong>Allowed corporate domains:</strong> {domains.length ? domains.join(', ') : 'None configured'}
            </p>
            <p className="mt-1">
              <strong>Development accounts:</strong> {isDevAuthEnabled() ? 'ENABLED (local development only)' : 'Disabled'}
            </p>
            <p className="mt-3 text-muted-foreground">
              ID tokens are verified for signature (JWKS), issuer, audience, expiry and a verified email in an allowed domain. Domain matching alone never grants access.
            </p>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">Configuration diagnostics</h3>
          <DiagnosticsList items={getDiagnostics()} />
        </section>
      </div>

      <section aria-labelledby="roles-heading" className="mt-12">
        <h2 id="roles-heading" className="mb-4 text-xl font-semibold text-foreground">
          Role assignments
        </h2>
        <RolesManager roles={roles} writable={writable} />
      </section>
    </AdminShell>
  )
}
