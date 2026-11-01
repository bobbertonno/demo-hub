import Link from 'next/link'
import type { ReactNode } from 'react'
import { Container } from '@/components/shared/page'
import type { HubUser } from '@/lib/auth/roles'
import type { CatalogMode } from '@/lib/catalog/repository'

const NAV = [
  { href: '/admin', label: 'Dashboard', minRole: 'contributor' },
  { href: '/admin/demos/new', label: 'Register demo', minRole: 'contributor' },
  { href: '/admin/integrations', label: 'Integrations', minRole: 'admin' },
  { href: '/admin/settings', label: 'Settings', minRole: 'admin' },
] as const

export function AdminShell({
  user,
  mode,
  active,
  title,
  description,
  actions,
  children,
}: {
  user: HubUser
  mode: CatalogMode
  active: string
  title: string
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  const nav = NAV.filter((n) => n.minRole === 'contributor' || user.role === 'admin')
  return (
    <div className="bg-background">
      <div className="border-b border-white/10 bg-hero text-hero-foreground">
        <Container className="py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-leaf">Administration</p>
              <h1 className="mt-2 text-balance text-3xl font-semibold">{title}</h1>
              {description ? <p className="mt-2 max-w-2xl text-pretty text-white/75">{description}</p> : null}
            </div>
            <div className="flex flex-col items-start gap-1 text-sm text-white/75 md:items-end">
              <span>
                Signed in as <span className="font-semibold text-white">{user.email}</span>
              </span>
              <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-xs uppercase tracking-wide">{user.role}</span>
            </div>
          </div>
          <nav aria-label="Administration" className="mt-6 flex flex-wrap gap-1">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active === n.href ? 'page' : undefined}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${active === n.href ? 'bg-leaf text-forest' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </Container>
      </div>
      {mode === 'seed' ? (
        <div role="status" className="border-b border-border bg-surface">
          <Container className="py-3 text-sm text-foreground">
            <strong>Read-only seed catalog.</strong> MONGODB_URI is not configured, so create, edit, publish, upload and sync actions will be rejected by the server. Connect MongoDB Atlas or start the local Docker container to enable writes.
          </Container>
        </div>
      ) : null}
      <Container className="py-10">
        {actions ? <div className="mb-6 flex flex-wrap justify-end gap-2">{actions}</div> : null}
        {children}
      </Container>
    </div>
  )
}
