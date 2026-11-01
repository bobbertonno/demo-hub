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
  { href: '/demos', label: 'Demos' },
  { href: '/capabilities', label: 'Capabilities' },
  { href: '/architectures', label: 'Architectures' },
  { href: '/getting-started', label: 'Getting started' },
  { href: '/about', label: 'About' },
]

export function HeaderNav({ user, signOutAction }: { user: NavUser; signOutAction: () => Promise<void> }) {
  const pathname = usePathname()
  const { darkMode, toggle } = useHubTheme()
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(false), [pathname])

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const links = user && user.role !== 'viewer' ? [...NAV, { href: '/admin', label: 'Admin' }] : NAV

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-hero text-hero-foreground">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 rounded" aria-label="MongoDB Demo Hub home">
          <HubLogo />
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-semibold">Demo Hub</span>
            <span className="text-[11px] text-white/60">Solutions Architect Edition</span>
          </span>
        </Link>
        <nav aria-label="Primary" className="hidden flex-1 lg:block">
          <ul className="flex items-center gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? 'page' : undefined}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10 ${isActive(l.href) ? 'text-leaf' : 'text-white/85'}`}
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
            <div className="hidden items-center gap-3 md:flex">
              <div className="flex flex-col items-end leading-tight">
                <span className="max-w-48 truncate text-sm">{user.name}</span>
                <span className="flex items-center gap-1 text-[11px] text-white/60">
                  {user.role}
                  {user.authMethod === 'dev' && <Badge variant="yellow">DEV</Badge>}
                </span>
              </div>
              <form action={signOutAction}>
                <button type="submit" className="rounded-md border border-white/25 px-3 py-1.5 text-sm hover:bg-white/10">
                  Sign out
                </button>
              </form>
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
