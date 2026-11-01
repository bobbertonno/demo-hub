/**
 * Idempotent seed: runs migrations, then inserts the four DRAFT demos and the
 * capability definitions only when absent ($setOnInsert). Existing admin edits
 * are never overwritten. Usage: pnpm db:seed
 */
import { MongoClient } from 'mongodb'
import { bootstrapCatalog } from '../lib/db/bootstrap'

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is required. Start local MongoDB with `docker compose up -d` and set MONGODB_URI=mongodb://localhost:27017')
  const client = new MongoClient(uri, { appName: 'demo-hub-seed' })
  await client.connect()
  try {
    const db = client.db(process.env.MONGODB_DB || 'demo_hub')
    const r = await bootstrapCatalog(db, (m) => console.log(`migration: ${m}`))
    console.log(`migrations applied this run: ${r.migrationsApplied.length}`)
    console.log(`demos: ${r.demosInserted} inserted, ${r.demosAlreadyPresent} already present`)
    console.log(`capabilities: ${r.capabilitiesInserted} inserted, ${r.capabilitiesAlreadyPresent} already present`)
  } finally {
    await client.close()
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message.replace(/\/\/[^@\s]+@/g, '//***@') : err)
  process.exit(1)
})
