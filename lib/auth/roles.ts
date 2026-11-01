export const ROLES = ['viewer', 'contributor', 'admin'] as const
export type Role = (typeof ROLES)[number]

const rank: Record<Role, number> = { viewer: 0, contributor: 1, admin: 2 }

export function hasRole(actual: Role | null | undefined, required: Role): boolean {
  if (!actual) return false
  return rank[actual] >= rank[required]
}

export type HubUser = {
  email: string
  name: string
  role: Role
  authMethod: 'oidc' | 'dev'
}

export const DEV_ACCOUNTS: { email: string; name: string; role: Role }[] = [
  { email: 'viewer@dev.local', name: 'Dev Viewer (development only)', role: 'viewer' },
  { email: 'contributor@dev.local', name: 'Dev Contributor (development only)', role: 'contributor' },
  { email: 'admin@dev.local', name: 'Dev Admin (development only)', role: 'admin' },
]

/**
 * Corporate email check used AFTER the ID token signature, issuer, audience
 * and expiry have been verified. Domain matching alone is never sufficient:
 * email_verified must be strictly true.
 */
export function isAllowedCorporateIdentity(claims: { email?: unknown; email_verified?: unknown }, allowedDomains: string[]): boolean {
  if (claims.email_verified !== true) return false
  if (typeof claims.email !== 'string') return false
  const email = claims.email.trim().toLowerCase()
  const at = email.lastIndexOf('@')
  if (at < 1 || at !== email.indexOf('@')) return false
  const domain = email.slice(at + 1)
  return allowedDomains.includes(domain)
}
