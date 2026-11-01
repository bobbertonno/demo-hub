import 'server-only'
import { z } from 'zod'

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))

const booleanFlag = z
  .string()
  .optional()
  .transform((v) => v === 'true' || v === '1')

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  VERCEL_ENV: optionalString,
  MONGODB_URI: optionalString,
  MONGODB_DB: z.string().trim().default('demo_hub'),
  OIDC_ISSUER: optionalString,
  OIDC_CLIENT_ID: optionalString,
  OIDC_CLIENT_SECRET: optionalString,
  OIDC_PROVIDER_NAME: z.string().default('MongoDB SSO'),
  ALLOWED_EMAIL_DOMAINS: z.string().default('mongodb.com'),
  AUTH_SECRET: optionalString,
  INITIAL_ADMIN_EMAILS: z.string().default(''),
  DEV_AUTH_MODE: booleanFlag,
  DEV_AUTH_ALLOW_PREVIEW: booleanFlag,
  GITHUB_APP_ID: optionalString,
  GITHUB_PRIVATE_KEY: optionalString,
  GITHUB_APP_INSTALLATION_ID: optionalString,
  GITHUB_TOKEN: optionalString,
  GITHUB_WEBHOOK_SECRET: optionalString,
  CRON_SECRET: optionalString,
  BLOB_READ_WRITE_TOKEN: optionalString,
  FEATURE_README_PATCHES: booleanFlag,
  FEATURE_WEBINAR_MODE: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
})

export type ServerEnv = z.infer<typeof envSchema>

let cached: ServerEnv | null = null

export function getEnv(): ServerEnv {
  if (cached) return cached
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    // Fail loudly at startup with field names only — never values.
    const fields = parsed.error.issues.map((i) => i.path.join('.')).join(', ')
    throw new Error(`Invalid server configuration for: ${fields}`)
  }
  cached = parsed.data
  return cached
}

/** True on any deployed Vercel environment or a production Node process. */
export function isProductionLike(env = getEnv()): boolean {
  return env.NODE_ENV === 'production' || env.VERCEL_ENV === 'production' || env.VERCEL_ENV === 'preview'
}

export function isDevAuthEnabled(env = getEnv()): boolean {
  if (!env.DEV_AUTH_MODE) return false
  if (env.VERCEL_ENV === 'production') return false
  if (env.VERCEL_ENV === 'preview') return env.DEV_AUTH_ALLOW_PREVIEW && env.NODE_ENV !== 'production'
  return env.NODE_ENV !== 'production'
}

export function isSsoConfigured(env = getEnv()): boolean {
  return Boolean(env.OIDC_ISSUER && env.OIDC_CLIENT_ID && env.OIDC_CLIENT_SECRET && env.AUTH_SECRET)
}

export function isDatabaseConfigured(env = getEnv()): boolean {
  return Boolean(env.MONGODB_URI)
}

export type GithubAuthMode = 'app' | 'token' | 'none'

export function githubAuthMode(env = getEnv()): GithubAuthMode {
  if (env.GITHUB_APP_ID && env.GITHUB_PRIVATE_KEY && env.GITHUB_APP_INSTALLATION_ID) return 'app'
  if (env.GITHUB_TOKEN) return 'token'
  return 'none'
}

export function allowedEmailDomains(env = getEnv()): string[] {
  return env.ALLOWED_EMAIL_DOMAINS.split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)
}

export function redact(value: string | undefined): string {
  if (!value) return 'not set'
  return `set (${value.length} chars, redacted)`
}

export type DiagnosticItem = {
  key: string
  label: string
  status: 'configured' | 'missing' | 'optional-missing' | 'disabled'
  detail: string
}

/** Diagnostics safe to render in the admin UI: presence only, never secret values. */
export function getDiagnostics(): DiagnosticItem[] {
  const env = getEnv()
  const item = (
    key: string,
    label: string,
    present: boolean,
    required: boolean,
    detail: string,
  ): DiagnosticItem => ({
    key,
    label,
    status: present ? 'configured' : required ? 'missing' : 'optional-missing',
    detail,
  })

  const prodLike = isProductionLike(env)
  return [
    item('MONGODB_URI', 'MongoDB Atlas connection', Boolean(env.MONGODB_URI), true, env.MONGODB_URI ? `Database "${env.MONGODB_DB}"` : 'Read-only seed catalog in use'),
    item('OIDC_ISSUER', 'OIDC issuer', Boolean(env.OIDC_ISSUER), prodLike, env.OIDC_ISSUER ? safeOrigin(env.OIDC_ISSUER) : 'Corporate SSO unavailable'),
    item('OIDC_CLIENT_ID', 'OIDC client ID', Boolean(env.OIDC_CLIENT_ID), prodLike, redact(env.OIDC_CLIENT_ID)),
    item('OIDC_CLIENT_SECRET', 'OIDC client secret', Boolean(env.OIDC_CLIENT_SECRET), prodLike, redact(env.OIDC_CLIENT_SECRET)),
    item('AUTH_SECRET', 'Session signing secret', Boolean(env.AUTH_SECRET), prodLike, redact(env.AUTH_SECRET)),
    item('ALLOWED_EMAIL_DOMAINS', 'Allowed corporate domains', true, true, allowedEmailDomains(env).join(', ')),
    item('GITHUB_APP_ID', 'GitHub App', githubAuthMode(env) === 'app', false, githubAuthMode(env) === 'app' ? 'GitHub App credentials present' : 'Not configured'),
    item('GITHUB_TOKEN', 'GitHub token (fallback)', Boolean(env.GITHUB_TOKEN), false, redact(env.GITHUB_TOKEN)),
    item('GITHUB_WEBHOOK_SECRET', 'GitHub webhook secret', Boolean(env.GITHUB_WEBHOOK_SECRET), false, redact(env.GITHUB_WEBHOOK_SECRET)),
    item('CRON_SECRET', 'Scheduled sync secret', Boolean(env.CRON_SECRET), false, redact(env.CRON_SECRET)),
    item('BLOB_READ_WRITE_TOKEN', 'Screenshot object storage (Vercel Blob)', Boolean(env.BLOB_READ_WRITE_TOKEN), false, redact(env.BLOB_READ_WRITE_TOKEN)),
    {
      key: 'DEV_AUTH_MODE',
      label: 'Development-only accounts',
      status: isDevAuthEnabled(env) ? 'configured' : 'disabled',
      detail: isDevAuthEnabled(env) ? 'ENABLED — local development only' : env.DEV_AUTH_MODE ? 'Requested but blocked in this environment' : 'Disabled',
    },
  ]
}

function safeOrigin(url: string): string {
  try {
    return new URL(url).origin
  } catch {
    return 'invalid URL'
  }
}
