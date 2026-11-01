import Link from 'next/link'
import { getCatalogMode } from '@/lib/catalog/repository'
import { isDevAuthEnabled, isSsoConfigured } from '@/lib/config/env'

/** Persistent, honest status strip: which integrations are actually active. */
export function EnvironmentBanner() {
  const seed = getCatalogMode() === 'seed'
  const dev = isDevAuthEnabled()
  const sso = isSsoConfigured()
  if (!seed && !dev && sso) return null
  const parts: string[] = []
  if (seed) parts.push('Read-only seed catalog — MongoDB is not configured, so edits cannot be saved')
  if (dev) parts.push('Development-only accounts enabled')
  if (!sso) parts.push('Corporate SSO not configured')
  return (
    <div role="status" className="border-b border-yellow-300 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-xs sm:px-6 lg:px-8">
        <span className="font-semibold uppercase tracking-wide">Setup state</span>
        <span>{parts.join(' · ')}</span>
        <Link href="/getting-started#hub-setup" className="ml-auto underline underline-offset-2">
          Configure the Hub
        </Link>
      </div>
    </div>
  )
}
