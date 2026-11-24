import { getDb } from '@/lib/db/mongo'
import { runMigrations } from '@/lib/db/migrations'
import { processPendingJobs } from '@/lib/import/pipeline'
import { ensureSearchIndexes } from '@/lib/search/catalog-search'

const log = (m: string) => console.log(`[demo-hub] ${m}`)

async function initializeSearch(attempt = 1): Promise<void> {
  try {
    await ensureSearchIndexes(await getDb(), log)
    log('search indexes ready')
  } catch (e) {
    if (attempt >= 20) return log(`search index setup failed: ${e instanceof Error ? e.message : e}`)
    setTimeout(() => void initializeSearch(attempt + 1), Math.min(30_000, 2_000 * attempt))
  }
}

/** Long-running servers only (Docker/self-hosted); serverless relies on after() and cron. */
export function startBackgroundServices() {
  if (!process.env.MONGODB_URI) return
  if (process.env.DEMO_HUB_AUTO_INIT === 'true') {
    void getDb()
      .then((db) => runMigrations(db, log))
      .then(() => initializeSearch())
      .catch((e) => log(`initialization failed: ${e instanceof Error ? e.message : e}`))
  }
  if (process.env.IMPORT_WORKER === 'embedded') {
    let busy = false
    setInterval(() => {
      if (busy) return
      busy = true
      processPendingJobs(2)
        .catch((e) => log(`worker error: ${e instanceof Error ? e.message : e}`))
        .finally(() => (busy = false))
    }, 5_000).unref()
    log('embedded import worker started')
  }
}
