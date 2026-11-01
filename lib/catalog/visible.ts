import 'server-only'
import { listDemos } from './repository'
import { getSettings } from './settings'

/** Demos visible in public browsing pages, honoring the `showDraftsInCatalog` setting. */
export async function getVisibleDemos() {
  const [result, settings] = await Promise.all([listDemos(), getSettings()])
  const data = result.data.filter((d) => d.status !== 'archived' && (settings.showDraftsInCatalog || d.status === 'published'))
  return { ...result, data, settings }
}
