'use client'

import Badge from '@leafygreen-ui/badge'
import Icon from '@leafygreen-ui/icon'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useHubTheme } from '@/components/providers'
import { HubLogo } from './hub-logo'

type NavUser = { name: string; email: string; role: 'viewer' | 'contributor' | 'admin'; authMethod: 'oidc' | 'dev' } | null

const NAV = [
  { href: '/', label: 'Demo Hub' },
  { href: '/demos', label: 'Solutions' },
  { href: '/architectures', label: 'Architectures' },
  { href: '/capabilities', label: 'Use Cases' },
  { href: '/getting-started', label: 'Resources' },
  { href: '/about', label: 'About' },
]

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?'

export function HeaderNav({ user, signOutAction }: { user: NavUser; signOutAction: () => Promise<void> }) {
  const pathname = usePathname()
  const { darkMode, toggle } = useHubTheme()
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    setOpen(false)
    setMenuOpen(false)
  }, [pathname])

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`))
  const links = user && user.role !== 'viewer' ? [...NAV, { href: '/admin', label: 'Admin' }] : NAV

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-forest text-white">
      <div className="flex h-16 w-full items-stretch gap-8 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 rounded" aria-label="MongoDB Demo Hub home">
          <HubLogo size={28} />
          <span className="text-xl font-semibold tracking-tight">MongoDB</span>
        </Link>
        <nav aria-label="Primary" className="hidden flex-1 lg:flex">
          <ul className="flex items-stretch gap-2">
            {links.map((l) => (
              <li key={l.href} className="flex">
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? 'page' : undefined}
                  className={`flex items-center border-b-[3px] px-3 pt-[3px] text-[15px] font-medium transition-colors ${
                    isActive(l.href) ? 'border-leaf text-white' : 'border-transparent text-white/85 hover:text-white'
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            className="flex size-9 items-center justify-center rounded-md text-white/85 hover:bg-white/10"
          >
            <Icon glyph={darkMode ? 'Sun' : 'Moon'} fill="currentColor" />
          </button>
          {user ? (
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-controls="account-menu"
                aria-label={`Account menu for ${user.name}`}
                className="flex size-10 items-center justify-center rounded-full bg-[#00A35C] text-sm font-semibold text-white ring-offset-2 ring-offset-forest hover:ring-2 hover:ring-leaf"
              >
                {initials(user.name)}
              </button>
              {menuOpen && (
                <div
                  id="account-menu"
                  className="absolute right-0 top-12 w-64 rounded-xl border bg-background p-4 text-foreground shadow-lg"
                  onKeyDown={(e) => e.key === 'Escape' && setMenuOpen(false)}
                >
                  <p className="truncate text-sm font-semibold">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  <p className="mt-2 flex items-center gap-2 text-xs capitalize text-muted-foreground">
                    {user.role}
                    {user.authMethod === 'dev' && <Badge variant="yellow">DEMO</Badge>}
                  </p>
                  <form action={signOutAction} className="mt-3 border-t pt-3">
                    <button type="submit" className="w-full rounded-md border px-3 py-1.5 text-sm hover:bg-surface">
                      Sign out
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="hidden rounded-md bg-leaf px-3.5 py-1.5 text-sm font-semibold text-forest hover:bg-[#71F6BA] md:inline-block">
              Sign in
            </Link>
          )}
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-md hover:bg-white/10 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon glyph={open ? 'X' : 'Menu'} fill="currentColor" />
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-white/10 px-4 pb-4 lg:hidden">
          <ul className="flex flex-col gap-1 pt-2">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} aria-current={isActive(l.href) ? 'page' : undefined} className={`block rounded-md px-3 py-2 text-sm ${isActive(l.href) ? 'bg-white/10 text-leaf' : ''}`}>
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 border-t border-white/10 pt-3">
              {user ? (
                <form action={signOutAction} className="flex items-center justify-between px-3">
                  <span className="text-sm text-white/75">
                    {user.email} · {user.role}
                  </span>
                  <button type="submit" className="rounded-md border border-white/25 px-3 py-1.5 text-sm">
                    Sign out
                  </button>
                </form>
              ) : (
                <Link href="/login" className="block rounded-md bg-leaf px-3 py-2 text-center text-sm font-semibold text-forest">
                  Sign in
                </Link>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
