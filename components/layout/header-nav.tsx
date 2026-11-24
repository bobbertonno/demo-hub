'use client'

import Icon from '@leafygreen-ui/icon'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useHubTheme } from '@/components/providers'
import { ImportRepositoryDialog } from '@/components/import/import-repository-dialog'
import { HubLogo } from './hub-logo'

const NAV = [
  { href: '/', label: 'Demo Hub' },
  { href: '/demos', label: 'Solutions' },
  { href: '/architectures', label: 'Architectures' },
  { href: '/capabilities', label: 'Use Cases' },
  { href: '/getting-started', label: 'Resources' },
  { href: '/compatibility', label: 'Prepare a Demo' },
  { href: '/about', label: 'About' },
  { href: '/admin', label: 'Admin' },
]

export function HeaderNav() {
  const pathname = usePathname()
  const { darkMode, toggle } = useHubTheme()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`))
  const links = NAV

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
          <ImportRepositoryDialog />
          <button
            type="button"
            onClick={toggle}
            aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            className="flex size-9 items-center justify-center rounded-md text-white/85 hover:bg-white/10"
          >
            <Icon glyph={darkMode ? 'Sun' : 'Moon'} fill="currentColor" />
          </button>
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
          </ul>
        </nav>
      )}
    </header>
  )
}
