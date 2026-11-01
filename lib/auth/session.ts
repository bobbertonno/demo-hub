import 'server-only'
import { redirect } from 'next/navigation'
import { getEnv, isDatabaseConfigured, isDevAuthEnabled, isProductionLike } from '@/lib/config/env'
import { COLLECTIONS, getCollection } from '@/lib/db/mongo'
import { auth, isAuthAvailable } from './auth'
import { DEV_ACCOUNTS, ROLES, hasRole, type HubUser, type Role } from './roles'

type RoleDoc = { email: string; role: Role; updatedAt: string; updatedBy: string }

async function resolveRole(email: string, method: 'oidc' | 'dev'): Promise<Role> {
  if (method === 'dev') {
    if (!isDevAuthEnabled()) return 'viewer'
    return DEV_ACCOUNTS.find((a) => a.email === email)?.role ?? 'viewer'
  }
  const bootstrap = getEnv()
    .INITIAL_ADMIN_EMAILS.split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (isDatabaseConfigured()) {
    try {
      const col = await getCollection<RoleDoc>(COLLECTIONS.userRoles)
      const doc = await col.findOne({ email })
      if (doc && (ROLES as readonly string[]).includes(doc.role)) return doc.role
    } catch {
      // fall through to least privilege
    }
  }
  return bootstrap.includes(email) ? 'admin' : 'viewer'
}

/** Resolves the current user and their role server-side on every call. */
export async function getCurrentUser(): Promise<HubUser | null> {
  if (!isAuthAvailable()) return null
  let session
  try {
    session = await auth()
  } catch {
    return null
  }
  const email = session?.user?.email?.toLowerCase()
  if (!email) return null
  const method = ((session as unknown as { authMethod?: string }).authMethod === 'dev' ? 'dev' : 'oidc') as 'oidc' | 'dev'
  if (method === 'dev' && !isDevAuthEnabled()) return null
  return { email, name: session?.user?.name ?? email, role: await resolveRole(email, method), authMethod: method }
}

/** Browsing requires authentication in any production-like environment. */
export function browsingRequiresAuth(): boolean {
  return isProductionLike()
}

export type AccessResult = { user: HubUser | null; anonymousLocal: boolean }

/** For public catalog pages. Redirects to /login when access is required. */
export async function requireBrowseAccess(path: string): Promise<AccessResult> {
  const user = await getCurrentUser()
  if (user) return { user, anonymousLocal: false }
  if (!browsingRequiresAuth()) return { user: null, anonymousLocal: true }
  redirect(`/login?callbackUrl=${encodeURIComponent(path)}`)
}

/** For admin pages: returns user or a reason; the page renders the matching state. */
export async function checkPageRole(required: Role): Promise<{ ok: true; user: HubUser } | { ok: false; reason: 'unauthenticated' | 'forbidden' | 'not-configured'; user: HubUser | null }> {
  if (!isAuthAvailable()) return { ok: false, reason: 'not-configured', user: null }
  const user = await getCurrentUser()
  if (!user) return { ok: false, reason: 'unauthenticated', user: null }
  if (!hasRole(user.role, required)) return { ok: false, reason: 'forbidden', user }
  return { ok: true, user }
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

/** For API routes. Throws HttpError(401/403/503). */
export async function requireApiRole(required: Role): Promise<HubUser> {
  if (!isAuthAvailable()) throw new HttpError(503, 'Authentication is not configured. Configure corporate SSO (OIDC).')
  const user = await getCurrentUser()
  if (!user) throw new HttpError(401, 'Authentication required')
  if (!hasRole(user.role, required)) throw new HttpError(403, `Requires ${required} role`)
  return user
}

/** For read-only API routes: same policy as browsing pages. */
export async function requireApiBrowse(): Promise<HubUser | null> {
  const user = await getCurrentUser()
  if (user) return user
  if (!browsingRequiresAuth()) return null
  if (!isAuthAvailable()) throw new HttpError(503, 'Authentication is not configured.')
  throw new HttpError(401, 'Authentication required')
}

export async function setUserRole(email: string, role: Role, actor: string) {
  const col = await getCollection<RoleDoc>(COLLECTIONS.userRoles)
  await col.updateOne({ email: email.toLowerCase() }, { $set: { email: email.toLowerCase(), role, updatedAt: new Date().toISOString(), updatedBy: actor } }, { upsert: true })
}

export async function listUserRoles(): Promise<RoleDoc[]> {
  if (!isDatabaseConfigured()) return []
  const col = await getCollection<RoleDoc>(COLLECTIONS.userRoles)
  return col.find({}, { projection: { _id: 0 } }).sort({ email: 1 }).limit(500).toArray()
}
