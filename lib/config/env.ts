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
  MONGODB_URI: optionalString,
  MONGODB_DB: z.string().trim().default('demo_hub'),
  GITHUB_APP_ID: optionalString,
  GITHUB_PRIVATE_KEY: optionalString,
  GITHUB_APP_INSTALLATION_ID: optionalString,
  GITHUB_TOKEN: optionalString,
  GITHUB_WEBHOOK_SECRET: optionalString,
  CRON_SECRET: optionalString,
  ASSET_STORAGE_DIR: z.string().trim().default('.data/assets'),
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

export function isDatabaseConfigured(env = getEnv()): boolean {
  return Boolean(env.MONGODB_URI)
}

export type GithubAuthMode = 'app' | 'token' | 'none'

export function githubAuthMode(env = getEnv()): GithubAuthMode {
  if (env.GITHUB_APP_ID && env.GITHUB_PRIVATE_KEY && env.GITHUB_APP_INSTALLATION_ID) return 'app'
  if (env.GITHUB_TOKEN) return 'token'
  return 'none'
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

  return [
    item('MONGODB_URI', 'MongoDB connection', Boolean(env.MONGODB_URI), true, env.MONGODB_URI ? `Database "${env.MONGODB_DB}"` : 'Read-only seed catalog in use'),
    item('GITHUB_APP_ID', 'GitHub App', githubAuthMode(env) === 'app', false, githubAuthMode(env) === 'app' ? 'GitHub App credentials present' : 'Not configured'),
    item('GITHUB_TOKEN', 'GitHub token (fallback)', Boolean(env.GITHUB_TOKEN), false, redact(env.GITHUB_TOKEN)),
    item('GITHUB_WEBHOOK_SECRET', 'GitHub webhook secret', Boolean(env.GITHUB_WEBHOOK_SECRET), false, redact(env.GITHUB_WEBHOOK_SECRET)),
    item('CRON_SECRET', 'Scheduled sync secret', Boolean(env.CRON_SECRET), false, redact(env.CRON_SECRET)),
    item('ASSET_STORAGE_DIR', 'Screenshot storage (local disk)', true, false, env.ASSET_STORAGE_DIR),
  ]
}
