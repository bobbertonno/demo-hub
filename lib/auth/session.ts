import 'server-only'
import { LOCAL_USER, hasRole, type HubUser, type Role } from './roles'

/**
 * The Hub runs on a local machine without user access control: every request
 * acts as the single local operator, who holds the admin role.
 */
export async function getCurrentUser(): Promise<HubUser> {
  return LOCAL_USER
}

export type AccessResult = { user: HubUser }

export async function requireBrowseAccess(_path?: string): Promise<AccessResult> {
  return { user: LOCAL_USER }
}

export async function checkPageRole(_required: Role): Promise<{ ok: true; user: HubUser }> {
  return { ok: true, user: LOCAL_USER }
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export async function requireApiRole(required: Role): Promise<HubUser> {
  if (!hasRole(LOCAL_USER.role, required)) throw new HttpError(403, `Requires ${required} role`)
  return LOCAL_USER
}

export async function requireApiBrowse(): Promise<HubUser> {
  return LOCAL_USER
}
