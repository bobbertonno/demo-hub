import Link from 'next/link'
import { getCatalogMode } from '@/lib/catalog/repository'
import { HubLogo } from './hub-logo'

export function SiteFooter() {
  const mode = getCatalogMode()
  return (
    <footer className="mt-16 border-t bg-hero text-hero-foreground">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="flex flex-col gap-3 md:col-span-2">
          <div className="flex items-center gap-3">
            <HubLogo size={28} />
            <span className="font-semibold">MongoDB Demo Hub</span>
          </div>
          <p className="max-w-md text-sm text-white/65">
            Internal catalog for Solutions Architect demos. The Hub documents demos and links to their repositories; it never executes or deploys them.
          </p>
          <p className="text-xs text-white/50">Catalog source: {mode === 'database' ? 'MongoDB Atlas' : 'Read-only seed catalog (no database configured)'}</p>
        </div>
        <nav aria-label="Footer catalog">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Catalog</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-white/80">
            <li><Link href="/demos" className="hover:text-leaf">All demos</Link></li>
            <li><Link href="/capabilities" className="hover:text-leaf">Capabilities</Link></li>
            <li><Link href="/architectures" className="hover:text-leaf">Architectures</Link></li>
          </ul>
        </nav>
        <nav aria-label="Footer resources">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Resources</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-white/80">
            <li><Link href="/getting-started" className="hover:text-leaf">Getting started</Link></li>
            <li><Link href="/about" className="hover:text-leaf">Governance & contributing</Link></li>
            <li><a href="https://www.mongodb.com/docs/atlas/" target="_blank" rel="noreferrer" className="hover:text-leaf">Atlas documentation</a></li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}
