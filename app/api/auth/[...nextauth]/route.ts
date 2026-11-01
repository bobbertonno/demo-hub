import { NextResponse } from 'next/server'
import { handlers, isAuthAvailable } from '@/lib/auth/auth'

const notConfigured = () => NextResponse.json({ error: 'Authentication is not configured' }, { status: 503 })

export async function GET(req: Request) {
  if (!isAuthAvailable()) return notConfigured()
  return handlers.GET(req as never)
}

export async function POST(req: Request) {
  if (!isAuthAvailable()) return notConfigured()
  return handlers.POST(req as never)
}
