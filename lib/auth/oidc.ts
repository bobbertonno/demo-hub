import 'server-only'
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import { allowedEmailDomains, getEnv } from '@/lib/config/env'
import { isAllowedCorporateIdentity } from './roles'

type Discovery = { issuer: string; jwks_uri: string }
let discoveryCache: { at: number; value: Discovery } | null = null
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

async function discover(issuer: string): Promise<Discovery> {
  if (discoveryCache && Date.now() - discoveryCache.at < 60 * 60 * 1000) return discoveryCache.value
  const url = new URL('.well-known/openid-configuration', issuer.endsWith('/') ? issuer : `${issuer}/`)
  if (url.protocol !== 'https:') throw new Error('OIDC issuer must use https')
  const res = await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store' })
  if (!res.ok) throw new Error(`OIDC discovery failed (${res.status})`)
  const value = (await res.json()) as Discovery
  if (!value.jwks_uri || new URL(value.jwks_uri).protocol !== 'https:') throw new Error('Invalid jwks_uri')
  discoveryCache = { at: Date.now(), value }
  jwks = createRemoteJWKSet(new URL(value.jwks_uri))
  return value
}

/**
 * Independently verifies the ID token returned by the corporate IdP:
 * signature (JWKS), issuer, audience, expiry, verified email and domain.
 */
export async function verifyCorporateIdToken(idToken: string): Promise<JWTPayload & { email: string }> {
  const env = getEnv()
  if (!env.OIDC_ISSUER || !env.OIDC_CLIENT_ID) throw new Error('SSO is not configured')
  const meta = await discover(env.OIDC_ISSUER)
  if (!jwks) throw new Error('JWKS unavailable')
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: meta.issuer,
    audience: env.OIDC_CLIENT_ID,
    requiredClaims: ['exp', 'iat', 'sub'],
    clockTolerance: 30,
  })
  if (!isAllowedCorporateIdentity(payload as { email?: unknown; email_verified?: unknown }, allowedEmailDomains(env))) {
    throw new Error('Identity is not a verified corporate account')
  }
  return payload as JWTPayload & { email: string }
}
