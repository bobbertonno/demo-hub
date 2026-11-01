import 'server-only'
import { z } from 'zod'
import { getEnv, isDatabaseConfigured } from '@/lib/config/env'
import { COLLECTIONS, getCollection } from '@/lib/db/mongo'
import { ReadOnlyCatalogError } from './repository'

export const CatalogSettings = z.object({
  showDraftsInCatalog: z.boolean(),
  featureFlags: z.object({
    webinarMode: z.boolean(),
    readmePatches: z.boolean(),
    contributorProposals: z.boolean(),
    scheduledSync: z.boolean(),
  }),
  appearance: z.object({
    hubName: z.string().min(1).max(80),
    tagline: z.string().max(200),
    supportContact: z.string().max(200),
  }),
  updatedAt: z.string().nullable(),
  updatedBy: z.string().nullable(),
})
export type CatalogSettings = z.infer<typeof CatalogSettings>

export function defaultSettings(): CatalogSettings {
  const env = getEnv()
  return {
    showDraftsInCatalog: true,
    featureFlags: {
      webinarMode: env.FEATURE_WEBINAR_MODE,
      readmePatches: env.FEATURE_README_PATCHES,
      contributorProposals: true,
      scheduledSync: true,
    },
    appearance: {
      hubName: 'MongoDB Demo Hub',
      tagline: 'Solutions Architect Edition',
      supportContact: 'Solutions Architecture team channel',
    },
    updatedAt: null,
    updatedBy: null,
  }
}

type SettingsDoc = { key: 'catalog'; value: CatalogSettings }

export async function getSettings(): Promise<CatalogSettings> {
  if (!isDatabaseConfigured()) return defaultSettings()
  try {
    const col = await getCollection<SettingsDoc>(COLLECTIONS.catalogSettings)
    const doc = await col.findOne({ key: 'catalog' })
    if (!doc) return defaultSettings()
    const merged = CatalogSettings.safeParse({ ...defaultSettings(), ...doc.value })
    return merged.success ? merged.data : defaultSettings()
  } catch {
    return defaultSettings()
  }
}

export async function saveSettings(input: unknown, actorEmail: string): Promise<CatalogSettings> {
  if (!isDatabaseConfigured()) throw new ReadOnlyCatalogError()
  const value = CatalogSettings.parse({ ...(input as object), updatedAt: new Date().toISOString(), updatedBy: actorEmail })
  const col = await getCollection<SettingsDoc>(COLLECTIONS.catalogSettings)
  await col.updateOne({ key: 'catalog' }, { $set: { key: 'catalog', value } }, { upsert: true })
  return value
}
