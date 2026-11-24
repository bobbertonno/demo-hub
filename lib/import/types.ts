import type { CompatibilityReport } from '../compatibility/standard'

export const IMPORT_STAGES = ['metadata', 'tree', 'manifest', 'readme', 'architecture', 'screenshots', 'capabilities', 'compatibility', 'search'] as const
export type ImportStage = (typeof IMPORT_STAGES)[number]

export const STAGE_LABELS: Record<ImportStage, string> = {
  metadata: 'Repository metadata',
  tree: 'Repository structure',
  manifest: 'Manifest discovery',
  readme: 'README extraction',
  architecture: 'Architecture analysis',
  screenshots: 'Screenshot discovery',
  capabilities: 'Capability extraction',
  compatibility: 'Compatibility assessment',
  search: 'Search synchronization',
}

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed'

export type StageResult = { stage: ImportStage; status: 'ok' | 'skipped' | 'failed'; detail?: string; finishedAt: string }

export type ImportJob = {
  id: string
  kind: 'import' | 'sync'
  demoSlug: string
  repositoryKey: string
  status: JobStatus
  stage: ImportStage | null
  stages: StageResult[]
  attempts: number
  maxAttempts: number
  error: string | null
  active?: true
  lockedUntil: Date | null
  runAfter: Date
  createdAt: Date
  updatedAt: Date
  finishedAt: Date | null
  actorEmail: string | null
}

export type RepositoryInfo = {
  fullName: string
  htmlUrl: string
  description: string | null
  topics: string[]
  license: string | null
  languages: string[]
  contributors: { login: string; url: string }[]
  defaultBranch: string
  private: boolean
  pushedAt: string | null
  latestCommit: { sha: string; message: string; date: string | null } | null
}

/** System-owned catalog metadata kept beside the editable DemoRecord fields. */
export type DemoHubMeta = {
  repositoryKey: string | null
  imported: boolean
  overrides: string[]
  repositoryInfo: RepositoryInfo | null
  compatibility: CompatibilityReport | null
  importState: { jobId: string; status: JobStatus; stage: ImportStage | null; error: string | null; updatedAt: string } | null
  searchText?: { readme: string; architecture: string }
  embedding?: number[]
}

/** Catalog fields an import may fill; once an admin edits one it is never overwritten. */
export const ENRICHABLE_FIELDS = ['title', 'summary', 'tagline', 'category', 'industry', 'tags', 'useCases', 'capabilities', 'architecture', 'screenshots', 'maintainer', 'localSetup', 'atlasSetup', 'configuration', 'demoModes', 'businessProblem', 'maturity', 'documentationStatus'] as const
