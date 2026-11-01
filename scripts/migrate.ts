/** Applies pending migrations (indexes, schema evolution). Safe to re-run. Usage: pnpm db:migrate */
import { MongoClient } from 'mongodb'
import { runMigrations } from '../lib/db/migrations'

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is required')
  const client = new MongoClient(uri, { appName: 'demo-hub-migrate' })
  await client.connect()
  try {
    const applied = await runMigrations(client.db(process.env.MONGODB_DB || 'demo_hub'), (m) => console.log(`applied: ${m}`))
    console.log(applied.length ? `${applied.length} migration(s) applied` : 'database is up to date')
  } finally {
    await client.close()
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message.replace(/\/\/[^@\s]+@/g, '//***@') : err)
  process.exit(1)
})
