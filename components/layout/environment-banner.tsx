import Link from 'next/link'
import { getCatalogMode } from '@/lib/catalog/repository'

/** Shown only when MongoDB is not configured and the catalog cannot be edited. */
export function EnvironmentBanner() {
  if (getCatalogMode() !== 'seed') return null
  return (
    <div role="status" className="border-b border-yellow-300 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-xs sm:px-6 lg:px-8">
        <span className="font-semibold uppercase tracking-wide">Setup state</span>
        <span>Read-only seed catalog. MongoDB is not configured, so edits cannot be saved.</span>
        <Link href="/getting-started#hub-setup" className="ml-auto underline underline-offset-2">
          Configure the Hub
        </Link>
      </div>
    </div>
  )
}
