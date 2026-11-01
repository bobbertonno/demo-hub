import 'server-only'
import { MongoClient, type Db, type Document, type Collection } from 'mongodb'
import { getEnv } from '@/lib/config/env'

import { COLLECTIONS } from './mongo-names'

export { COLLECTIONS }

type GlobalWithMongo = typeof globalThis & { __demoHubMongo?: Promise<MongoClient> }

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super('MONGODB_URI is not configured. The catalog is running in read-only seed mode.')
    this.name = 'DatabaseNotConfiguredError'
  }
}

function getClientPromise(): Promise<MongoClient> {
  const env = getEnv()
  if (!env.MONGODB_URI) throw new DatabaseNotConfiguredError()
  const g = globalThis as GlobalWithMongo
  if (!g.__demoHubMongo) {
    const client = new MongoClient(env.MONGODB_URI, {
      appName: 'mongodb-demo-hub',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    })
    g.__demoHubMongo = client.connect().catch((err) => {
      g.__demoHubMongo = undefined
      throw err
    })
  }
  return g.__demoHubMongo
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise()
  return client.db(getEnv().MONGODB_DB)
}

export async function getCollection<T extends Document>(name: (typeof COLLECTIONS)[keyof typeof COLLECTIONS]): Promise<Collection<T>> {
  const db = await getDb()
  return db.collection<T>(name)
}

export async function pingDatabase(): Promise<{ ok: boolean; error?: string }> {
  try {
    const db = await getDb()
    await db.command({ ping: 1 })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? sanitizeDbError(err.message) : 'Unknown error' }
  }
}

/** Strip anything resembling a connection string or credentials from driver errors. */
export function sanitizeDbError(message: string): string {
  return message.replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, 'mongodb://[redacted]').slice(0, 500)
}
