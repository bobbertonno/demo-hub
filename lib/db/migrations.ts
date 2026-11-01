import type { Db } from 'mongodb'
import { COLLECTIONS } from './mongo-names'

export type Migration = { id: string; description: string; up: (db: Db) => Promise<void> }

export const migrations: Migration[] = [
  {
    id: '001-initial-indexes',
    description: 'Create catalog, sync, audit and role indexes',
    up: async (db) => {
      await db.collection(COLLECTIONS.demos).createIndexes([
        { key: { slug: 1 }, name: 'uniq_slug', unique: true },
        { key: { id: 1 }, name: 'uniq_id', unique: true },
        { key: { status: 1, updatedAt: -1 }, name: 'status_updated' },
        { key: { 'capabilities.capability': 1 }, name: 'capability_ids' },
        { key: { repository: 1 }, name: 'repo_identity', unique: true, partialFilterExpression: { repository: { $type: 'string' } } },
        { key: { 'sync.status': 1 }, name: 'sync_status' },
        { key: { industry: 1, maturity: 1, difficulty: 1 }, name: 'filters' },
        { key: { demoModes: 1 }, name: 'runtime_modes' },
        { key: { useCases: 1 }, name: 'use_cases' },
      ])
      await db.collection(COLLECTIONS.capabilities).createIndex({ id: 1 }, { unique: true, name: 'uniq_capability' })
      await db.collection(COLLECTIONS.demoAssets).createIndexes([
        { key: { demoSlug: 1, order: 1 }, name: 'demo_order' },
        { key: { id: 1 }, name: 'uniq_asset', unique: true },
      ])
      await db.collection(COLLECTIONS.documentationSnapshots).createIndexes([
        { key: { demoSlug: 1, ref: 1, fetchedAt: -1 }, name: 'demo_ref_latest' },
        { key: { repository: 1 }, name: 'snapshot_repo' },
      ])
      await db.collection(COLLECTIONS.githubSyncJobs).createIndexes([
        { key: { demoSlug: 1, startedAt: -1 }, name: 'demo_jobs' },
        { key: { status: 1, startedAt: -1 }, name: 'job_status' },
      ])
      await db.collection(COLLECTIONS.auditLogs).createIndexes([
        { key: { at: -1 }, name: 'audit_time' },
        { key: { 'target.id': 1, at: -1 }, name: 'audit_target' },
        { key: { actorEmail: 1, at: -1 }, name: 'audit_actor' },
      ])
      await db.collection(COLLECTIONS.userRoles).createIndex({ email: 1 }, { unique: true, name: 'uniq_email' })
      await db.collection(COLLECTIONS.catalogSettings).createIndex({ key: 1 }, { unique: true, name: 'uniq_setting' })
      await db.collection(COLLECTIONS.changeProposals).createIndexes([
        { key: { status: 1, createdAt: -1 }, name: 'proposal_status' },
        { key: { demoSlug: 1 }, name: 'proposal_demo' },
      ])
    },
  },
]

/** Applies pending migrations once; records each in schema_migrations. Idempotent. */
export async function runMigrations(db: Db, log: (msg: string) => void = () => {}): Promise<string[]> {
  const applied = db.collection<{ _id: string; appliedAt: Date }>(COLLECTIONS.migrations)
  const done = new Set((await applied.find({}).toArray()).map((m) => m._id))
  const ran: string[] = []
  for (const m of migrations) {
    if (done.has(m.id)) continue
    log(`Applying migration ${m.id}: ${m.description}`)
    await m.up(db)
    await applied.insertOne({ _id: m.id, appliedAt: new Date() })
    ran.push(m.id)
  }
  return ran
}
