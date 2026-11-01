import type { Db } from 'mongodb'
import { runMigrations } from './migrations'
import { COLLECTIONS } from './mongo-names'
import { DemoRecord } from '../schemas/manifest'
import { seedCapabilities } from '../seed/capabilities'
import { seedDemos } from '../seed/demos'

export type BootstrapResult = {
  migrationsApplied: string[]
  demosInserted: number
  demosAlreadyPresent: number
  capabilitiesInserted: number
  capabilitiesAlreadyPresent: number
}

/**
 * Idempotent catalog initialization: applies pending migrations (indexes), then inserts
 * the DRAFT seed demos and capability definitions only when absent ($setOnInsert),
 * so existing admin edits are never overwritten. Shared by `pnpm db:seed` and the admin UI.
 */
export async function bootstrapCatalog(db: Db, log: (msg: string) => void = () => {}): Promise<BootstrapResult> {
  const migrationsApplied = await runMigrations(db, log)

  let demosInserted = 0
  for (const demo of seedDemos) {
    const valid = DemoRecord.parse(demo)
    const res = await db.collection(COLLECTIONS.demos).updateOne({ slug: valid.slug }, { $setOnInsert: valid }, { upsert: true })
    if (res.upsertedCount) demosInserted++
  }

  let capabilitiesInserted = 0
  for (const cap of seedCapabilities) {
    const res = await db.collection(COLLECTIONS.capabilities).updateOne({ id: cap.id }, { $setOnInsert: cap }, { upsert: true })
    if (res.upsertedCount) capabilitiesInserted++
  }

  return {
    migrationsApplied,
    demosInserted,
    demosAlreadyPresent: seedDemos.length - demosInserted,
    capabilitiesInserted,
    capabilitiesAlreadyPresent: seedCapabilities.length - capabilitiesInserted,
  }
}
