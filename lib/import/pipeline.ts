import 'server-only'
import { randomUUID } from 'node:crypto'
import type { Collection, Document } from 'mongodb'
import { createDemo, getDemoBySlug } from '@/lib/catalog/repository'
import {
  CAPABILITY_MAP,
  assessCompatibility,
  detectCapabilities,
  discoverResources,
  selectSourceFiles,
  validateManifestText,
  type DemoHubManifest,
} from '@/lib/compatibility/standard'
import { githubAuthMode } from '@/lib/config/env'
import { COLLECTIONS, getCollection } from '@/lib/db/mongo'
import { GithubError, assertSafePath, getRawFile, githubRequest, parseRepoUrl, repoPath } from '@/lib/github/client'
import { syncDemo } from '@/lib/github/sync'
import type { RepoRef } from '@/lib/github/types'
import { DemoRecord, type CapabilityMapping } from '@/lib/schemas/manifest'
import { embedText } from '@/lib/search/embeddings'
import { humanizeRepoName, normalizeRepositoryInput, slugFromRepo } from './normalize'
import { ENRICHABLE_FIELDS, IMPORT_STAGES, type DemoHubMeta, type ImportJob, type ImportStage, type RepositoryInfo, type StageResult } from './types'

const STAGE_TIMEOUT_MS = 45_000
const LEASE_MS = 5 * 60_000
const MAX_ATTEMPTS = 3
const MAX_RAW_BYTES = 1_000_000

type DemoDoc = DemoRecord & { hub?: DemoHubMeta }
type GhRepo = {
  full_name: string
  html_url: string
  name: string
  owner: { login: string }
  description: string | null
  topics?: string[]
  license: { spdx_id: string | null; name: string } | null
  default_branch: string
  private: boolean
  pushed_at: string | null
}

export class ImportError extends Error {
  constructor(
    public status: number,
    message: string,
    public slug?: string,
  ) {
    super(message)
  }
}

let indexesReady: Promise<void> | null = null
async function jobsCollection(): Promise<Collection<ImportJob>> {
  const jobs = await getCollection<ImportJob>(COLLECTIONS.importJobs)
  indexesReady ??= (async () => {
    const demos = await getCollection<Document>(COLLECTIONS.demos)
    await Promise.all([
      jobs.createIndex({ demoSlug: 1 }, { unique: true, partialFilterExpression: { active: true }, name: 'one_active_job_per_demo' }),
      jobs.createIndex({ status: 1, runAfter: 1 }),
      jobs.createIndex({ id: 1 }, { unique: true }),
      demos.createIndex({ 'hub.repositoryKey': 1 }, { unique: true, partialFilterExpression: { 'hub.repositoryKey': { $type: 'string' } }, name: 'unique_repository_key' }),
    ])
  })().catch((e) => {
    indexesReady = null
    throw e
  })
  await indexesReady
  return jobs
}

async function demosCollection() {
  return getCollection<DemoDoc>(COLLECTIONS.demos)
}

function describeGithubError(err: unknown): string {
  if (err instanceof GithubError) {
    if (err.status === 403 || err.status === 429) return 'GitHub rate limit reached or access denied. Configure GITHUB_TOKEN for higher limits and private repositories.'
    if (err.status === 401) return 'GitHub credentials were rejected. Check GITHUB_TOKEN or the GitHub App configuration.'
    return err.message
  }
  return err instanceof Error ? err.message : 'Unknown error'
}

// ---------- Import entry point ----------

export async function importRepository(input: { url: string; ref?: string | null }, actor: { email: string; role: string }) {
  let normalized
  try {
    normalized = normalizeRepositoryInput(input.url)
  } catch (e) {
    throw new ImportError(400, e instanceof Error ? e.message : 'Invalid URL')
  }
  const ref: RepoRef = { owner: normalized.owner, repo: normalized.repo }

  let repo: GhRepo
  try {
    const res = await githubRequest<GhRepo>(repoPath(ref, ''))
    if (res.status !== 'ok') throw new ImportError(404, 'Repository not found, or the configured GitHub credentials cannot access it.')
    repo = res.data
  } catch (e) {
    if (e instanceof ImportError) throw e
    throw new ImportError(502, describeGithubError(e))
  }

  const key = repo.full_name.toLowerCase()
  const canonicalUrl = repo.html_url
  const demos = await demosCollection()
  await jobsCollection()
  const existing = await demos.findOne(
    { $or: [{ 'hub.repositoryKey': key }, { repository: { $regex: `^${canonicalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`, $options: 'i' } }] },
    { projection: { slug: 1 } },
  )
  if (existing) throw new ImportError(409, 'This repository is already in the catalog.', existing.slug)

  const base = slugFromRepo(repo.name)
  const candidates = [base, slugFromRepo(`${base}-${repo.owner.login}`), ...[2, 3, 4, 5].map((n) => `${base}-${n}`)]
  let slug: string | null = null
  for (const c of candidates) if (!(await demos.findOne({ slug: c }, { projection: { _id: 1 } }))) {
    slug = c
    break
  }
  if (!slug) slug = `${base}-${randomUUID().slice(0, 6)}`

  const branch = input.ref || normalized.ref || repo.default_branch
  const demo = await createDemo({
    id: slug,
    slug,
    title: humanizeRepoName(repo.name),
    tagline: repo.description?.slice(0, 200) || undefined,
    summary: repo.description?.slice(0, 1200) || `Demo imported from ${repo.full_name}.`,
    businessProblem: '',
    industry: 'Uncategorized',
    tags: (repo.topics ?? []).slice(0, 30).map((t) => t.slice(0, 40)),
    repository: canonicalUrl,
    defaultBranch: branch,
    demoModes: ['local-demo'],
    maintainer: { name: repo.owner.login.slice(0, 120) },
    maturity: 'prototype',
    documentationStatus: 'missing',
    verificationTimestamp: null,
    releaseVersion: null,
    status: actor.role === 'admin' ? 'published' : 'in_review',
  })

  const job = await enqueueJob(slug, key, 'import', actor.email)
  const hub: DemoHubMeta = {
    repositoryKey: key,
    imported: true,
    overrides: [],
    repositoryInfo: null,
    compatibility: null,
    importState: { jobId: job.id, status: job.status, stage: null, error: null, updatedAt: new Date().toISOString() },
  }
  try {
    await demos.updateOne({ slug }, { $set: { hub } })
  } catch (e) {
    await demos.deleteOne({ slug })
    throw new ImportError(409, 'This repository was imported concurrently.', undefined)
    void e
  }
  return { demo, job }
}

// ---------- Job queue ----------

export async function enqueueJob(demoSlug: string, repositoryKey: string, kind: ImportJob['kind'], actorEmail: string | null): Promise<ImportJob> {
  const jobs = await jobsCollection()
  const now = new Date()
  const job: ImportJob = {
    id: randomUUID(),
    kind,
    demoSlug,
    repositoryKey,
    status: 'queued',
    stage: null,
    stages: [],
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    error: null,
    active: true,
    lockedUntil: null,
    runAfter: now,
    createdAt: now,
    updatedAt: now,
    finishedAt: null,
    actorEmail,
  }
  try {
    await jobs.insertOne({ ...job })
    return job
  } catch (e) {
    if ((e as { code?: number }).code === 11000) {
      const active = await jobs.findOne({ demoSlug, active: true }, { projection: { _id: 0 } })
      if (active) return active
    }
    throw e
  }
}

export async function getLatestJob(demoSlug: string): Promise<ImportJob | null> {
  const jobs = await jobsCollection()
  return jobs.findOne({ demoSlug }, { sort: { createdAt: -1 }, projection: { _id: 0 } })
}

async function claim(filter: Document): Promise<ImportJob | null> {
  const jobs = await jobsCollection()
  const now = new Date()
  return jobs.findOneAndUpdate(
    { ...filter, $or: [{ status: 'queued', runAfter: { $lte: now } }, { status: 'running', lockedUntil: { $lt: now } }] },
    { $set: { status: 'running', lockedUntil: new Date(now.getTime() + LEASE_MS), updatedAt: now }, $inc: { attempts: 1 } },
    { sort: { runAfter: 1 }, returnDocument: 'after', projection: { _id: 0 } },
  )
}

/** Picks up queued work and jobs whose worker died mid-run (expired lease). */
export async function processPendingJobs(limit = 3): Promise<number> {
  let done = 0
  for (; done < limit; done++) {
    const job = await claim({})
    if (!job) break
    await runJob(job)
  }
  return done
}

export async function processJobById(id: string): Promise<void> {
  const job = await claim({ id })
  if (job) await runJob(job)
}

// ---------- Enrichment ----------

function withTimeout<T>(p: Promise<T>, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out`)), STAGE_TIMEOUT_MS)
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e) => (clearTimeout(t), reject(e)),
    )
  })
}

function firstParagraph(markdown: string): string | null {
  const blocks = markdown.replace(/```[\s\S]*?```/g, '').split(/\n\s*\n/)
  for (const b of blocks) {
    const t = b.trim()
    if (!t || /^(#|!\[|<|\[!\[|\||>|-{3,})/.test(t)) continue
    const plain = t.replace(/!\[[^\]]*]\([^)]*\)/g, '').replace(/\[([^\]]+)]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim()
    if (plain.length > 20) return plain.slice(0, 1200)
  }
  return null
}

function plainText(markdown: string, max: number): string {
  return markdown.replace(/```[\s\S]*?```/g, ' ').replace(/<[^>]+>/g, ' ').replace(/[#*_`>|[\]()!-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

const MERMAID_START = /^(flowchart|graph|sequenceDiagram|classDiagram|erDiagram|stateDiagram(-v2)?|C4Context|C4Container|journey|architecture-beta|block-beta)\b/

async function runJob(job: ImportJob): Promise<void> {
  const jobs = await jobsCollection()
  const demos = await demosCollection()
  const stages: StageResult[] = []
  const setState = async (stage: ImportStage | null, status: ImportJob['status'], error: string | null = null) => {
    const now = new Date()
    await jobs.updateOne({ id: job.id }, { $set: { stage, stages, updatedAt: now, lockedUntil: new Date(now.getTime() + LEASE_MS) } })
    await demos.updateOne({ slug: job.demoSlug }, { $set: { 'hub.importState': { jobId: job.id, status, stage, error, updatedAt: now.toISOString() } } })
  }
  const step = async <T>(stage: ImportStage, fn: () => Promise<T>, fatal = false): Promise<T | null> => {
    await setState(stage, 'running')
    try {
      const value = await withTimeout(fn(), stage)
      stages.push({ stage, status: 'ok', finishedAt: new Date().toISOString() })
      return value
    } catch (e) {
      const detail = describeGithubError(e)
      stages.push({ stage, status: 'failed', detail, finishedAt: new Date().toISOString() })
      if (fatal) throw new Error(detail)
      return null
    }
  }

  try {
    const demo = await getDemoBySlug(job.demoSlug)
    if (!demo?.repository) throw new Error('Demo or repository no longer exists')
    const doc = await demos.findOne({ slug: job.demoSlug }, { projection: { hub: 1 } })
    const hub: Partial<DemoHubMeta> = doc?.hub ?? {}
    const ref = parseRepoUrl(demo.repository)
    const branch = demo.defaultBranch

    const meta = await step(
      'metadata',
      async () => {
        const [repo, languages, contributors, commit] = await Promise.all([
          githubRequest<GhRepo>(repoPath(ref, '')),
          githubRequest<Record<string, number>>(repoPath(ref, '/languages')),
          githubRequest<{ login: string; html_url: string }[]>(repoPath(ref, '/contributors?per_page=10')),
          githubRequest<{ sha: string; commit: { message: string; author: { date: string } | null } }>(repoPath(ref, `/commits/${encodeURIComponent(branch)}`)),
        ])
        if (repo.status !== 'ok') throw new Error('Repository is no longer accessible')
        if (commit.status !== 'ok') throw new Error(`Branch "${branch}" not found`)
        const info: RepositoryInfo = {
          fullName: repo.data.full_name,
          htmlUrl: repo.data.html_url,
          description: repo.data.description,
          topics: repo.data.topics ?? [],
          license: repo.data.license?.spdx_id ?? repo.data.license?.name ?? null,
          languages: languages.status === 'ok' ? Object.keys(languages.data).slice(0, 10) : [],
          contributors: contributors.status === 'ok' && Array.isArray(contributors.data) ? contributors.data.map((c) => ({ login: c.login, url: c.html_url })) : [],
          defaultBranch: repo.data.default_branch,
          private: repo.data.private,
          pushedAt: repo.data.pushed_at,
          latestCommit: { sha: commit.data.sha, message: commit.data.commit.message.split('\n')[0].slice(0, 200), date: commit.data.commit.author?.date ?? null },
        }
        return info
      },
      true,
    )
    const info = meta!
    const sha = info.latestCommit!.sha

    const readFile = async (path: string): Promise<string | null> => {
      const safe = assertSafePath(path)
      if (info.private) {
        const res = await getRawFile(ref, safe, sha)
        return res.status === 'ok' ? res.data.slice(0, MAX_RAW_BYTES) : null
      }
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 10_000)
      try {
        const res = await fetch(`https://raw.githubusercontent.com/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}/${sha}/${safe.split('/').map(encodeURIComponent).join('/')}`, { cache: 'no-store', redirect: 'error', signal: controller.signal })
        if (!res.ok) return null
        const text = await res.text()
        return text.slice(0, MAX_RAW_BYTES)
      } finally {
        clearTimeout(timer)
      }
    }

    const paths =
      (await step('tree', async () => {
        const res = await githubRequest<{ tree: { path: string; type: string }[] }>(repoPath(ref, `/git/trees/${sha}?recursive=1`))
        return res.status === 'ok' ? res.data.tree.filter((t) => t.type === 'blob').map((t) => t.path).slice(0, 20_000) : []
      })) ?? []
    const resources = discoverResources(paths)

    const manifestResult =
      (await step('manifest', async () => {
        if (!resources.manifest) return { present: false, valid: false, errors: [], data: null as DemoHubManifest | null }
        const text = await readFile(resources.manifest)
        if (text === null) return { present: true, valid: false, errors: ['Manifest could not be read'], data: null }
        return { present: true, ...validateManifestText(text) }
      })) ?? { present: false, valid: false, errors: [], data: null }
    const manifest = manifestResult.data

    const readmePath = manifest?.documentation?.readme ?? resources.readme
    const readme = await step('readme', async () => {
      if (!readmePath) return null
      if (readmePath !== demo.readmePath || branch !== demo.defaultBranch) await demos.updateOne({ slug: demo.slug }, { $set: { readmePath } })
      await syncDemo(demo.slug, 'manual', job.actorEmail)
      return readFile(readmePath)
    })

    const architecture = await step('architecture', async () => {
      const docPath = manifest?.architecture?.documentation ?? resources.architectureDocs[0]
      const diagramPath = manifest?.architecture?.diagram ?? resources.diagrams[0]
      const [doc, diagram] = await Promise.all([docPath ? readFile(docPath) : null, diagramPath ? readFile(diagramPath) : null])
      const mermaid = diagram?.trim() && MERMAID_START.test(diagram.trim()) && diagram.length <= 20_000 ? diagram.trim() : null
      return { doc, docPath, mermaid, diagramPath }
    })

    const screenshots =
      (await step('screenshots', async () => {
        if (info.private) return []
        const declared = (manifest?.screenshots ?? []).filter((s) => paths.includes(s.path))
        const list = declared.length ? declared : resources.screenshots.map((p) => ({ path: p, caption: p.split('/').pop()!.replace(/\.[a-z]+$/i, '').replace(/[-_]+/g, ' '), alt: undefined as string | undefined }))
        return list.slice(0, 12).map((s, i) => ({
          id: `repo-${i}`,
          url: `https://raw.githubusercontent.com/${ref.owner}/${ref.repo}/${sha}/${s.path.split('/').map(encodeURIComponent).join('/')}`,
          caption: s.caption.slice(0, 300),
          alt: (s.alt ?? s.caption).slice(0, 300),
          order: i,
          provenance: 'repository' as const,
        }))
      })) ?? []

    const capabilities =
      (await step('capabilities', async () => {
        const declared: CapabilityMapping[] = (manifest?.mongodbCapabilities ?? []).map((c) => ({
          capability: CAPABILITY_MAP[c.id],
          whyUsed: c.description.slice(0, 600),
          implementationLocation: c.evidence[0],
          verified: c.implementation === 'Verified implementation' && c.evidence.every((e) => paths.includes(e)),
        }))
        const max = githubAuthMode() === 'none' ? 6 : 15
        const toScan = [...resources.packageManifests, ...selectSourceFiles(paths, max)]
        const files = (await Promise.all(toScan.map(async (p) => ({ path: p, content: (await readFile(p).catch(() => null)) ?? '' })))).filter((f) => f.content)
        const detected = detectCapabilities(files)
          .filter((d) => !declared.some((c) => c.capability === d.capability))
          .map((d) => ({ capability: d.capability, whyUsed: `Detected automatically (${d.reason}). Unverified.`, implementationLocation: d.evidence, verified: false }))
        return [...declared, ...detected].slice(0, 20)
      })) ?? null

    const compatibility = await step('compatibility', async () => assessCompatibility({ paths, resources, manifest: manifestResult }))

    const overrides = new Set(hub.overrides ?? [])
    const patch: Partial<DemoRecord> = {}
    if (hub.imported) {
      const deployment = manifest?.deployment
      const modes = [deployment?.local?.supported || deployment?.docker?.supported ? 'local-demo' : null, deployment?.atlas?.supported ? 'atlas-connected' : null].filter(Boolean) as DemoRecord['demoModes']
      const candidate: Partial<DemoRecord> = {
        title: manifest?.name,
        summary: manifest?.description ?? info.description ?? (readme ? firstParagraph(readme) : null) ?? undefined,
        tagline: manifest?.tagline ?? info.description?.slice(0, 200) ?? undefined,
        category: manifest?.category,
        industry: manifest?.industry,
        tags: manifest?.tags.length ? manifest.tags : info.topics.slice(0, 30).map((t) => t.slice(0, 40)),
        useCases: manifest?.useCases,
        businessProblem: manifest?.businessProblem,
        maturity: manifest?.maturity,
        capabilities: capabilities ?? undefined,
        screenshots: screenshots.length ? screenshots : undefined,
        maintainer: manifest?.authors[0] ? { name: manifest.authors[0].name, ...(manifest.authors[0].email ? { email: manifest.authors[0].email } : {}) } : undefined,
        configuration: manifest?.configuration.length ? manifest.configuration.map((c) => ({ name: c.name, description: c.description, required: c.required, secret: c.secret, modes: [] })) : undefined,
        demoModes: modes.length ? modes : undefined,
        documentationStatus: readme ? 'partial' : 'missing',
        architecture:
          architecture && (architecture.doc || architecture.mermaid || manifest?.architecture?.overview)
            ? {
                ...demo.architecture,
                overview: (manifest?.architecture?.overview ?? (architecture.doc ? firstParagraph(architecture.doc) : null) ?? demo.architecture.overview ?? '').slice(0, 4000),
                diagrams: [
                  ...(architecture.mermaid ? [{ id: 'repository-architecture', title: 'Repository architecture', description: architecture.diagramPath ? `Source: ${architecture.diagramPath}` : '', mermaid: architecture.mermaid, provenance: 'repository' as const, illustrative: false }] : []),
                  ...demo.architecture.diagrams.filter((d) => d.provenance !== 'repository'),
                ],
              }
            : undefined,
      }
      for (const field of ENRICHABLE_FIELDS) {
        const value = candidate[field]
        if (value !== undefined && value !== null && !overrides.has(field)) (patch as Record<string, unknown>)[field] = value
      }
    }

    const searchText = { readme: readme ? plainText(readme, 50_000) : '', architecture: architecture?.doc ? plainText(architecture.doc, 20_000) : '' }
    const embedding = await step('search', async () => {
      const merged = { ...demo, ...patch }
      return embedText([merged.title, merged.summary, merged.tags.join(' '), searchText.readme.slice(0, 6000)].join('\n'))
    })

    const set: Record<string, unknown> = {
      'hub.repositoryInfo': info,
      'hub.compatibility': compatibility,
      'hub.searchText': searchText,
      'sync.commitSha': sha,
      updatedAt: new Date().toISOString(),
    }
    if (embedding) set['hub.embedding'] = embedding
    const merged = DemoRecord.safeParse({ ...demo, ...patch })
    if (merged.success) for (const k of Object.keys(patch)) set[k] = (merged.data as Record<string, unknown>)[k]
    else stages.push({ stage: 'compatibility', status: 'failed', detail: `Some extracted fields were invalid and were skipped: ${merged.error.issues[0]?.message}`, finishedAt: new Date().toISOString() })
    await demos.updateOne({ slug: job.demoSlug }, { $set: set })

    const failed = stages.filter((s) => s.status === 'failed')
    const summary = failed.length ? `${failed.length} stage(s) partially failed: ${failed.map((s) => s.stage).join(', ')}` : null
    await jobs.updateOne({ id: job.id }, { $set: { status: 'succeeded', stage: null, stages, error: summary, finishedAt: new Date(), updatedAt: new Date() }, $unset: { active: '' } })
    await demos.updateOne({ slug: job.demoSlug }, { $set: { 'hub.importState': { jobId: job.id, status: 'succeeded', stage: null, error: summary, updatedAt: new Date().toISOString() } } })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Enrichment failed'
    const retry = job.attempts < job.maxAttempts
    const now = new Date()
    await jobs.updateOne(
      { id: job.id },
      retry
        ? { $set: { status: 'queued', stages, error: message, runAfter: new Date(now.getTime() + 30_000 * job.attempts), lockedUntil: null, updatedAt: now } }
        : { $set: { status: 'failed', stages, error: message, finishedAt: now, lockedUntil: null, updatedAt: now }, $unset: { active: '' } },
    )
    await demos.updateOne({ slug: job.demoSlug }, { $set: { 'hub.importState': { jobId: job.id, status: retry ? 'queued' : 'failed', stage: null, error: message, updatedAt: now.toISOString() } } })
  }
}

export { IMPORT_STAGES }
