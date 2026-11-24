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
}

export const LOCAL_USER: HubUser = { email: 'local@demo-hub', name: 'Local operator', role: 'admin' }
