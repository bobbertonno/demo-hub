import 'server-only'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { HttpError } from '@/lib/auth/session'
import { sanitizeDbError } from '@/lib/db/mongo'

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

/**
 * Fixed-window rate limiter. Per-instance memory: adequate as a first line of
 * defence on serverless; pair with Vercel Firewall rules for global limits.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k)
    return true
  }
  b.count++
  return b.count <= limit
}

export function clientKey(req: Request, scope: string): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  return `${scope}:${ip}`
}

export function enforceRateLimit(req: Request, scope: string, limit = 60, windowMs = 60_000) {
  if (!rateLimit(clientKey(req, scope), limit, windowMs)) throw new HttpError(429, 'Too many requests')
}

export function errorResponse(err: unknown) {
  if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status })
  if (err instanceof ZodError) {
    return NextResponse.json({ error: 'Validation failed', issues: err.issues.slice(0, 30).map((i) => ({ path: i.path.join('.'), message: i.message })) }, { status: 422 })
  }
  if (err && typeof err === 'object' && 'status' in err && typeof (err as { status: unknown }).status === 'number') {
    const e = err as { status: number; message?: string }
    return NextResponse.json({ error: e.message ?? 'Request failed' }, { status: e.status })
  }
  const message = err instanceof Error ? sanitizeDbError(err.message) : 'Internal error'
  console.error('[demo-hub] API error:', message)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}

export function handle<Args extends unknown[]>(fn: (...args: Args) => Promise<Response>) {
  return async (...args: Args) => {
    try {
      return await fn(...args)
    } catch (err) {
      return errorResponse(err)
    }
  }
}

export async function readJson(req: Request, maxBytes = 512_000): Promise<unknown> {
  const text = await req.text()
  if (text.length > maxBytes) throw new HttpError(413, 'Payload too large')
  try {
    return JSON.parse(text)
  } catch {
    throw new HttpError(400, 'Invalid JSON')
  }
}

/** Basic CSRF defence for cookie-authenticated mutations. */
export function assertSameOrigin(req: Request) {
  const origin = req.headers.get('origin')
  if (!origin) return
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  try {
    if (new URL(origin).host !== host) throw new HttpError(403, 'Cross-origin request rejected')
  } catch (e) {
    if (e instanceof HttpError) throw e
    throw new HttpError(403, 'Invalid origin')
  }
}
