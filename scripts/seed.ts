/**
 * Idempotent seed: runs migrations, then inserts the four DRAFT demos and the
 * capability definitions only when absent ($setOnInsert). Existing admin edits
 * are never overwritten. Usage: pnpm db:seed
 */
import { MongoClient } from 'mongodb'
import { runMigrations } from '../lib/db/migrations'
import { COLLECTIONS } from '../lib/db/mongo-names'
import { DemoRecord } from '../lib/schemas/manifest'
import { seedCapabilities } from '../lib/seed/capabilities'
import { seedDemos } from '../lib/seed/demos'

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is required. Start local MongoDB with `docker compose up -d` and set MONGODB_URI=mongodb://localhost:27017')
  const client = new MongoClient(uri, { appName: 'demo-hub-seed' })
  await client.connect()
  try {
    const db = client.db(process.env.MONGODB_DB || 'demo_hub')
    const applied = await runMigrations(db, (m) => console.log(`migration: ${m}`))
    console.log(`migrations applied this run: ${applied.length}`)

    let inserted = 0
    for (const demo of seedDemos) {
      const valid = DemoRecord.parse(demo)
      const res = await db.collection(COLLECTIONS.demos).updateOne({ slug: valid.slug }, { $setOnInsert: valid }, { upsert: true })
      if (res.upsertedCount) inserted++
    }
    console.log(`demos: ${inserted} inserted, ${seedDemos.length - inserted} already present`)

    let caps = 0
    for (const cap of seedCapabilities) {
      const res = await db.collection(COLLECTIONS.capabilities).updateOne({ id: cap.id }, { $setOnInsert: cap }, { upsert: true })
      if (res.upsertedCount) caps++
    }
    console.log(`capabilities: ${caps} inserted, ${seedCapabilities.length - caps} already present`)
  } finally {
    await client.close()
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message.replace(/\/\/[^@\s]+@/g, '//***@') : err)
  process.exit(1)
})
