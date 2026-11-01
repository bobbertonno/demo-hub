import 'server-only'
import { randomUUID } from 'node:crypto'
import { parse as parseYaml } from 'yaml'
import { githubAuthMode } from '@/lib/config/env'
import { COLLECTIONS, getCollection, sanitizeDbError } from '@/lib/db/mongo'
import { getDemoBySlug, getLatestSnapshot, listDemos, updateSyncState } from '@/lib/catalog/repository'
import { DemoManifest, type DemoRecord } from '@/lib/schemas/manifest'
import { GithubError, getCommitSha, getRawFile, listDirectory, parseRepoUrl, type GithubFetch } from './client'
import { extractSetupFromReadme, renderRepositoryMarkdown } from './markdown'
import type { DocumentationSnapshot, ManifestConflict, SyncJob } from './types'

const IMAGE_EXT = /\.(png|jpe?g|webp|gif)$/i
const SCREENSHOT_DIRS = ['docs/screenshots', 'screenshots', 'docs/images']

export function detectConflicts(catalog: DemoRecord, manifest: Partial<DemoManifest> | null): ManifestConflict[] {
  if (!manifest) return []
  const fields: (keyof DemoManifest)[] = ['title', 'summary', 'industry', 'maturity', 'defaultBranch', 'readmePath', 'releaseVersion', 'themeMode']
  const out: ManifestConflict[] = []
  for (const f of fields) {
    const repoVal = manifest[f]
    if (repoVal === undefined || repoVal === null) continue
    const catVal = catalog[f]
    if (JSON.stringify(repoVal) !== JSON.stringify(catVal)) out.push({ field: f, catalogValue: String(catVal ?? ''), repositoryValue: String(repoVal) })
  }
  return out
}

export function parseManifestYaml(text: string): { valid: boolean; errors: string[]; data: Partial<DemoManifest> | null } {
  let raw: unknown
  try {
    raw = parseYaml(text, { maxAliasCount: 50 })
  } catch (e) {
    return { valid: false, errors: [`YAML parse error: ${e instanceof Error ? e.message.slice(0, 200) : 'unknown'}`], data: null }
  }
  const full = DemoManifest.safeParse(raw)
  if (full.success) return { valid: true, errors: [], data: full.data }
  const partial = DemoManifest.partial().safeParse(raw)
  return {
    valid: false,
    errors: full.error.issues.slice(0, 20).map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`),
    data: partial.success ? partial.data : null,
  }
}

export type SyncOutcome = { job: SyncJob; snapshot: DocumentationSnapshot | null; warning?: string }

/**
 * Synchronises README, demo.yaml and screenshots for one demo. On failure the
 * previous successful snapshot is preserved and the demo is marked "stale".
 */
export async function syncDemo(slug: string, trigger: SyncJob['trigger'], actorEmail: string | null, opts: { ref?: string; fetchImpl?: GithubFetch } = {}): Promise<SyncOutcome> {
  const demo = await getDemoBySlug(slug)
  if (!demo) throw new GithubError(404, 'Demo not found')
  if (!demo.repository) throw new GithubError(400, 'Demo has no registered GitHub repository')
  const repo = parseRepoUrl(demo.repository)
  const gitRef = opts.ref ?? demo.defaultBranch
  const jobs = await getCollection<SyncJob>(COLLECTIONS.githubSyncJobs)
  const snapshots = await getCollection<DocumentationSnapshot>(COLLECTIONS.documentationSnapshots)
  const job: SyncJob = { id: randomUUID(), demoSlug: slug, repository: demo.repository, trigger, actorEmail, status: 'running', startedAt: new Date().toISOString(), finishedAt: null, error: null, requests: 0 }
  await jobs.insertOne({ ...job })
  const previous = await getLatestSnapshot(slug)
  const sameRef = previous?.ref === gitRef ? previous : null
  const now = new Date().toISOString()

  try {
    const commitSha = await getCommitSha(repo, gitRef, opts.fetchImpl)
    job.requests++
    if (!commitSha) throw new GithubError(404, `Ref "${gitRef}" not found or repository inaccessible`)
    const contentRef = commitSha

    const readmeRes = await getRawFile(repo, demo.readmePath, gitRef, sameRef?.readme.etag, opts.fetchImpl)
    job.requests++
    const manifestRes = await getRawFile(repo, 'demo.yaml', gitRef, sameRef?.manifest.etag, opts.fetchImpl)
    job.requests++

    if (readmeRes.status === 'not-modified' && manifestRes.status === 'not-modified' && sameRef && sameRef.commitSha === commitSha) {
      job.status = 'not-modified'
      job.finishedAt = new Date().toISOString()
      await jobs.updateOne({ id: job.id }, { $set: job })
      await updateSyncState(slug, { status: 'ok', lastAttemptAt: now, lastSuccessAt: now, lastError: null, commitSha, ref: gitRef })
      return { job, snapshot: sameRef }
    }

    let readmeText: string | null = null
    if (readmeRes.status === 'ok') readmeText = readmeRes.data
    else if (readmeRes.status === 'not-modified' && sameRef) readmeText = null

    const readme: DocumentationSnapshot['readme'] =
      readmeRes.status === 'ok'
        ? { path: demo.readmePath, sha: commitSha, etag: readmeRes.etag, html: renderRepositoryMarkdown(readmeRes.data, repo, contentRef), rawLength: readmeRes.data.length, missing: false }
        : readmeRes.status === 'not-modified' && sameRef
          ? sameRef.readme
          : { path: demo.readmePath, sha: null, etag: null, html: '', rawLength: 0, missing: true }

    const setup = readmeText !== null ? extractSetupFromReadme(readmeText, demo.readmePath) : (sameRef?.setup ?? { local: [], atlas: [] })

    let manifest: DocumentationSnapshot['manifest']
    if (manifestRes.status === 'ok') {
      const parsed = parseManifestYaml(manifestRes.data)
      manifest = { present: true, etag: manifestRes.etag, ...parsed }
    } else if (manifestRes.status === 'not-modified' && sameRef) manifest = sameRef.manifest
    else manifest = { present: false, etag: null, valid: false, errors: [], data: null }

    const screenshots: DocumentationSnapshot['screenshots'] = []
    for (const dir of SCREENSHOT_DIRS) {
      const entries = await listDirectory(repo, dir, gitRef, opts.fetchImpl)
      job.requests++
      for (const e of entries) {
        if (e.type === 'file' && IMAGE_EXT.test(e.name) && e.size < 5_000_000) {
          screenshots.push({ path: e.path, url: `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${contentRef}/${e.path.split('/').map(encodeURIComponent).join('/')}` })
        }
      }
      if (screenshots.length) break
    }

    const snapshot: DocumentationSnapshot = {
      demoSlug: slug,
      repository: demo.repository,
      ref: gitRef,
      commitSha,
      status: 'ok',
      fetchedAt: new Date().toISOString(),
      readme,
      manifest,
      setup,
      conflicts: detectConflicts(demo, manifest.data),
      screenshots: screenshots.slice(0, 40),
    }
    await snapshots.insertOne({ ...snapshot })
    job.status = 'success'
    job.finishedAt = new Date().toISOString()
    await jobs.updateOne({ id: job.id }, { $set: job })
    await updateSyncState(slug, { status: 'ok', lastAttemptAt: now, lastSuccessAt: snapshot.fetchedAt, lastError: null, commitSha, ref: gitRef }, readme.missing ? { documentationStatus: 'missing' } : {})
    return { job, snapshot, warning: readme.missing ? `README not found at ${demo.readmePath}` : undefined }
  } catch (err) {
    const message = err instanceof GithubError ? err.message : sanitizeDbError(err instanceof Error ? err.message : 'Sync failed')
    job.status = 'failed'
    job.error = message
    job.finishedAt = new Date().toISOString()
    await jobs.updateOne({ id: job.id }, { $set: job })
    await updateSyncState(slug, { status: previous ? 'stale' : 'error', lastAttemptAt: now, lastError: message })
    return { job, snapshot: previous, warning: previous ? `Sync failed — showing last successful snapshot from ${previous.fetchedAt}` : `Sync failed: ${message}` }
  }
}

export async function syncAll(trigger: SyncJob['trigger'], actorEmail: string | null): Promise<SyncOutcome[]> {
  if (githubAuthMode() === 'none') {
    // Public repositories remain reachable unauthenticated at a low rate limit.
  }
  const { data } = await listDemos({ includeArchived: false })
  const out: SyncOutcome[] = []
  for (const d of data.filter((x) => x.repository)) out.push(await syncDemo(d.slug, trigger, actorEmail))
  return out
}

export async function listSyncJobs(limit = 50): Promise<SyncJob[]> {
  const col = await getCollection<SyncJob>(COLLECTIONS.githubSyncJobs)
  return col.find({}, { projection: { _id: 0 } }).sort({ startedAt: -1 }).limit(limit).toArray()
}

export async function findDemosByRepository(fullName: string): Promise<DemoRecord[]> {
  const { data } = await listDemos({ includeArchived: false })
  const target = fullName.toLowerCase()
  return data.filter((d) => {
    if (!d.repository) return false
    try {
      const r = parseRepoUrl(d.repository)
      return `${r.owner}/${r.repo}`.toLowerCase() === target
    } catch {
      return false
    }
  })
}
