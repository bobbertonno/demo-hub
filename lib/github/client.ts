import 'server-only'
import { SignJWT, importPKCS8 } from 'jose'
import { createPrivateKey } from 'node:crypto'
import { getEnv, githubAuthMode } from '@/lib/config/env'
import type { RepoRef } from './types'

const API = 'https://api.github.com'
const SAFE_SEGMENT = /^[A-Za-z0-9_.-]+$/
const SAFE_PATH = /^[A-Za-z0-9_./ -]+$/

export class GithubError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'GithubError'
  }
}

export function parseRepoUrl(url: string): RepoRef {
  const u = new URL(url)
  if (u.protocol !== 'https:' || u.hostname !== 'github.com') throw new Error('Only https://github.com repositories are supported')
  const [owner, repoRaw] = u.pathname.replace(/^\/|\/$/g, '').split('/')
  const repo = (repoRaw ?? '').replace(/\.git$/, '')
  if (!owner || !repo || !SAFE_SEGMENT.test(owner) || !SAFE_SEGMENT.test(repo)) throw new Error('Invalid repository URL')
  return { owner, repo }
}

export function assertSafePath(path: string): string {
  const clean = path.replace(/^\/+/, '')
  if (!SAFE_PATH.test(clean) || clean.split('/').some((s) => s === '..' || s === '.')) throw new Error(`Unsafe repository path: ${path}`)
  return clean
}

export function assertSafeRef(ref: string): string {
  if (!/^[A-Za-z0-9_./-]{1,120}$/.test(ref) || ref.includes('..')) throw new Error('Unsafe git ref')
  return ref
}

let installationToken: { token: string; expiresAt: number } | null = null

async function appInstallationToken(): Promise<string> {
  if (installationToken && installationToken.expiresAt - Date.now() > 60_000) return installationToken.token
  const env = getEnv()
  const pem = env.GITHUB_PRIVATE_KEY!.replace(/\\n/g, '\n')
  // GitHub issues PKCS#1 keys; normalise to PKCS#8 for jose.
  const pkcs8 = createPrivateKey(pem).export({ type: 'pkcs8', format: 'pem' }).toString()
  const key = await importPKCS8(pkcs8, 'RS256')
  const now = Math.floor(Date.now() / 1000)
  const jwt = await new SignJWT({}).setProtectedHeader({ alg: 'RS256' }).setIssuedAt(now - 30).setExpirationTime(now + 540).setIssuer(env.GITHUB_APP_ID!).sign(key)
  const res = await fetch(`${API}/app/installations/${encodeURIComponent(env.GITHUB_APP_INSTALLATION_ID!)}/access_tokens`, {
    method: 'POST',
    headers: { authorization: `Bearer ${jwt}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' },
    cache: 'no-store',
  })
  if (!res.ok) throw new GithubError(res.status, `GitHub App token exchange failed (${res.status})`)
  const body = (await res.json()) as { token: string; expires_at: string }
  installationToken = { token: body.token, expiresAt: new Date(body.expires_at).getTime() }
  return body.token
}

async function authHeader(): Promise<Record<string, string>> {
  const mode = githubAuthMode()
  if (mode === 'app') return { authorization: `Bearer ${await appInstallationToken()}` }
  if (mode === 'token') return { authorization: `Bearer ${getEnv().GITHUB_TOKEN}` }
  return {}
}

export type ConditionalResult<T> = { status: 'ok'; data: T; etag: string | null } | { status: 'not-modified'; etag: string | null } | { status: 'not-found' }

export type GithubFetch = typeof fetch

/** All requests go to the fixed api.github.com origin; callers cannot supply hosts (SSRF guard). */
export async function githubRequest<T>(
  path: string,
  opts: { etag?: string | null; accept?: string; parse?: 'json' | 'text'; fetchImpl?: GithubFetch } = {},
): Promise<ConditionalResult<T>> {
  if (!path.startsWith('/repos/')) throw new Error('Only repository endpoints are allowed')
  const headers: Record<string, string> = {
    accept: opts.accept ?? 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    'user-agent': 'mongodb-demo-hub',
    ...(await authHeader()),
  }
  if (opts.etag) headers['if-none-match'] = opts.etag
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await (opts.fetchImpl ?? fetch)(`${API}${path}`, { headers, cache: 'no-store', redirect: 'error', signal: controller.signal })
    const etag = res.headers.get('etag')
    if (res.status === 304) return { status: 'not-modified', etag }
    if (res.status === 404) return { status: 'not-found' }
    if (!res.ok) {
      const remaining = res.headers.get('x-ratelimit-remaining')
      throw new GithubError(res.status, remaining === '0' ? 'GitHub rate limit exceeded' : `GitHub API error ${res.status}`)
    }
    const len = Number(res.headers.get('content-length') ?? 0)
    if (len > 2_000_000) throw new GithubError(413, 'Repository file too large')
    const data = (opts.parse === 'text' ? await res.text() : await res.json()) as T
    return { status: 'ok', data, etag }
  } finally {
    clearTimeout(timer)
  }
}

export function repoPath(ref: RepoRef, suffix: string) {
  return `/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}${suffix}`
}

export async function getRawFile(ref: RepoRef, path: string, gitRef: string, etag?: string | null, fetchImpl?: GithubFetch) {
  const safe = assertSafePath(path)
  const encoded = safe.split('/').map(encodeURIComponent).join('/')
  return githubRequest<string>(repoPath(ref, `/contents/${encoded}?ref=${encodeURIComponent(assertSafeRef(gitRef))}`), {
    etag,
    accept: 'application/vnd.github.raw+json',
    parse: 'text',
    fetchImpl,
  })
}

export async function getCommitSha(ref: RepoRef, gitRef: string, fetchImpl?: GithubFetch): Promise<string | null> {
  const res = await githubRequest<{ sha: string }>(repoPath(ref, `/commits/${encodeURIComponent(assertSafeRef(gitRef))}`), { fetchImpl })
  return res.status === 'ok' ? res.data.sha : null
}

export async function listDirectory(ref: RepoRef, path: string, gitRef: string, fetchImpl?: GithubFetch) {
  const safe = assertSafePath(path)
  const res = await githubRequest<{ name: string; path: string; type: string; size: number }[]>(
    repoPath(ref, `/contents/${safe.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(assertSafeRef(gitRef))}`),
    { fetchImpl },
  )
  return res.status === 'ok' && Array.isArray(res.data) ? res.data : []
}

export async function listRefs(ref: RepoRef): Promise<{ branches: string[]; tags: string[] }> {
  const [b, t] = await Promise.all([
    githubRequest<{ name: string }[]>(repoPath(ref, '/branches?per_page=50')),
    githubRequest<{ name: string }[]>(repoPath(ref, '/tags?per_page=50')),
  ])
  return {
    branches: b.status === 'ok' ? b.data.map((x) => x.name) : [],
    tags: t.status === 'ok' ? t.data.map((x) => x.name) : [],
  }
}
