import { NextResponse } from 'next/server'
import { getCatalogMode } from '@/lib/catalog/repository'
import { isDatabaseConfigured } from '@/lib/config/env'
import { pingDatabase } from '@/lib/db/mongo'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = isDatabaseConfigured() ? await pingDatabase() : { ok: false, error: 'not configured' }
  return NextResponse.json({ ok: true, catalogMode: getCatalogMode(), database: db.ok ? 'ok' : db.error }, { headers: { 'cache-control': 'no-store' } })
}
