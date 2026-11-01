import type { DemoManifest, SetupStep } from '@/lib/schemas/manifest'

export type RepoRef = { owner: string; repo: string }

export type ExtractedSetup = {
  local: SetupStep[]
  atlas: SetupStep[]
}

export type ManifestConflict = {
  field: string
  catalogValue: string
  repositoryValue: string
}

export type DocumentationSnapshot = {
  demoSlug: string
  repository: string
  ref: string
  commitSha: string | null
  status: 'ok' | 'error'
  fetchedAt: string
  readme: {
    path: string
    sha: string | null
    etag: string | null
    html: string
    rawLength: number
    missing: boolean
  }
  manifest: {
    present: boolean
    etag: string | null
    valid: boolean
    errors: string[]
    data: Partial<DemoManifest> | null
  }
  setup: ExtractedSetup
  conflicts: ManifestConflict[]
  screenshots: { path: string; url: string }[]
  error?: string
}

export type SyncJob = {
  id: string
  demoSlug: string
  repository: string
  trigger: 'manual' | 'scheduled' | 'webhook'
  actorEmail: string | null
  status: 'running' | 'success' | 'not-modified' | 'failed'
  startedAt: string
  finishedAt: string | null
  error: string | null
  requests: number
}
