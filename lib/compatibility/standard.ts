import { z } from 'zod'
import type { CapabilityId } from '../schemas/manifest'

export const STANDARD_VERSION = '1.0'
export const MANIFEST_PATH = 'demo-hub/manifest.json'

export const CANONICAL_STRUCTURE = [
  { path: 'README.md', required: true, purpose: 'Overview, prerequisites, installation and usage.' },
  { path: 'demo-hub/manifest.json', required: false, purpose: 'Machine-readable catalog metadata (this standard).' },
  { path: 'demo-hub/architecture.md', required: false, purpose: 'Architecture explanation, components and data flow.' },
  { path: 'demo-hub/diagrams/architecture.mmd', required: false, purpose: 'Mermaid architecture diagram.' },
  { path: 'demo-hub/screenshots/', required: false, purpose: 'PNG, JPG or WebP screenshots of the running demo.' },
  { path: 'demo-hub/assets/', required: false, purpose: 'Additional images referenced by the documentation.' },
] as const

export const manifestCapabilityIds = [
  'crud',
  'aggregation',
  'mongodb-search',
  'vector-search',
  'voyage-ai',
  'change-streams',
  'stream-processing',
  'kafka',
  'online-archive',
  'sharding',
  'atlas',
  'atlas-infinite',
] as const
export const ManifestCapabilityId = z.enum(manifestCapabilityIds)
export type ManifestCapabilityId = z.infer<typeof ManifestCapabilityId>

/** Manifest ids are the public contract; catalog ids are internal. */
export const CAPABILITY_MAP: Record<ManifestCapabilityId, CapabilityId> = {
  crud: 'crud',
  aggregation: 'aggregation',
  'mongodb-search': 'atlas-search',
  'vector-search': 'vector-search',
  'voyage-ai': 'voyage-ai',
  'change-streams': 'change-streams',
  'stream-processing': 'stream-processing',
  kafka: 'kafka',
  'online-archive': 'online-archive',
  sharding: 'sharding',
  atlas: 'atlas',
  'atlas-infinite': 'atlas-infinite',
} as Record<ManifestCapabilityId, CapabilityId>

export const IMPLEMENTATION_LEVELS = ['Verified implementation', 'Partial implementation', 'Illustrative'] as const

const RelativePath = z
  .string()
  .max(300)
  .regex(/^(?!\/)(?!.*\.\.)[A-Za-z0-9_.\/ -]+$/, 'Repository-relative path without ".." expected')

/** Loose objects keep unknown keys so newer 1.x manifests remain importable. */
export const DemoHubManifest = z.looseObject({
  schemaVersion: z.string().regex(/^1\.\d+$/, 'Supported schemaVersion is 1.x'),
  name: z.string().min(1).max(120),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80).optional(),
  tagline: z.string().max(200).optional(),
  description: z.string().min(1).max(1200),
  businessProblem: z.string().max(4000).optional(),
  category: z.string().max(120).optional(),
  industry: z.string().max(80).optional(),
  useCases: z.array(z.string().max(80)).max(20).optional(),
  authors: z.array(z.looseObject({ name: z.string().min(1).max(120), github: z.string().max(80).optional(), email: z.string().email().optional() })).max(20).default([]),
  tags: z.array(z.string().max(40)).max(30).default([]),
  technologies: z.array(z.string().max(60)).max(40).default([]),
  mongodbCapabilities: z
    .array(
      z.looseObject({
        id: ManifestCapabilityId,
        name: z.string().max(120).optional(),
        description: z.string().min(1).max(600),
        implementation: z.enum(IMPLEMENTATION_LEVELS),
        evidence: z.array(RelativePath).max(10).default([]),
      }),
    )
    .max(20)
    .default([]),
  deployment: z
    .looseObject({
      local: z.looseObject({ supported: z.boolean(), command: z.string().max(400).optional() }).optional(),
      atlas: z.looseObject({ supported: z.boolean(), notes: z.string().max(600).optional() }).optional(),
      docker: z.looseObject({ supported: z.boolean(), command: z.string().max(400).optional() }).optional(),
    })
    .optional(),
  configuration: z
    .array(z.looseObject({ name: z.string().regex(/^[A-Z][A-Z0-9_]*$/), description: z.string().max(600), required: z.boolean().default(false), secret: z.boolean().default(false) }))
    .max(60)
    .default([]),
  screenshots: z.array(z.looseObject({ path: RelativePath, caption: z.string().max(300), alt: z.string().max(300).optional() })).max(20).default([]),
  architecture: z.looseObject({ documentation: RelativePath.optional(), diagram: RelativePath.optional(), overview: z.string().max(4000).optional() }).optional(),
  documentation: z.looseObject({ readme: RelativePath.optional(), installation: RelativePath.optional() }).optional(),
  maturity: z.enum(['concept', 'prototype', 'beta', 'stable', 'deprecated']).optional(),
})
export type DemoHubManifest = z.infer<typeof DemoHubManifest>

export function manifestJsonSchema() {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `https://demo-hub.mongodb.local/schemas/demo-hub-manifest-${STANDARD_VERSION}.json`,
    title: `MongoDB Demo Hub manifest v${STANDARD_VERSION}`,
    ...z.toJSONSchema(DemoHubManifest, { io: 'input' }),
  }
}

export function validateManifestText(text: string): { valid: boolean; errors: string[]; data: DemoHubManifest | null } {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (e) {
    return { valid: false, errors: [`Invalid JSON: ${e instanceof Error ? e.message : 'parse error'}`], data: null }
  }
  const parsed = DemoHubManifest.safeParse(raw)
  if (!parsed.success) return { valid: false, errors: parsed.error.issues.slice(0, 20).map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`), data: null }
  return { valid: true, errors: [], data: parsed.data }
}

// ---------- Repository discovery (deterministic, path based) ----------

const IMAGE_RE = /\.(png|jpe?g|webp|gif)$/i
const SCREENSHOT_DIR_RE = /(^|\/)(demo-hub\/screenshots|screenshots|docs\/screenshots|docs\/images|assets\/screenshots|images)\//i

export type DiscoveredResources = {
  readme: string | null
  manifest: string | null
  legacyManifest: string | null
  architectureDocs: string[]
  diagrams: string[]
  screenshots: string[]
  docker: string[]
  packageManifests: string[]
}

export function discoverResources(paths: string[]): DiscoveredResources {
  const lower = new Map(paths.map((p) => [p.toLowerCase(), p]))
  const pick = (...candidates: string[]) => candidates.map((c) => lower.get(c.toLowerCase())).find(Boolean) ?? null
  return {
    readme: pick('README.md', 'readme.markdown', 'README', 'docs/README.md'),
    manifest: pick(MANIFEST_PATH),
    legacyManifest: pick('demo.yaml', 'demo.yml'),
    architectureDocs: paths.filter((p) => /(^|\/)architecture[^/]*\.md$/i.test(p)).slice(0, 5),
    diagrams: paths.filter((p) => /\.(mmd|mermaid)$/i.test(p)).slice(0, 5),
    screenshots: paths.filter((p) => IMAGE_RE.test(p) && SCREENSHOT_DIR_RE.test(p)).slice(0, 12),
    docker: paths.filter((p) => /(^|\/)(dockerfile|docker-compose\.ya?ml|compose\.ya?ml)$/i.test(p)).slice(0, 5),
    packageManifests: paths.filter((p) => /(^|\/)(package\.json|requirements\.txt|pyproject\.toml|go\.mod|pom\.xml|build\.gradle)$/i.test(p) && !p.includes('node_modules/')).slice(0, 6),
  }
}

// ---------- Compatibility assessment ----------

export type CompatibilityLevel = 'basic' | 'enhanced' | 'fully-compatible'
export type ResourceCheck = { kind: string; path: string | null; status: 'found' | 'missing' | 'invalid'; detail?: string }
export type CompatibilityReport = {
  level: CompatibilityLevel
  standardVersion: string
  assessedAt: string
  manifest: { present: boolean; valid: boolean; errors: string[] }
  resources: ResourceCheck[]
  recommendations: string[]
}

export const COMPATIBILITY_LABELS: Record<CompatibilityLevel, string> = {
  basic: 'Basic',
  enhanced: 'Enhanced',
  'fully-compatible': 'Fully Compatible',
}

export function assessCompatibility(input: {
  paths: string[]
  resources: DiscoveredResources
  manifest: { present: boolean; valid: boolean; errors: string[]; data: DemoHubManifest | null }
  now?: Date
}): CompatibilityReport {
  const { resources: r, manifest } = input
  const pathSet = new Set(input.paths)
  const checks: ResourceCheck[] = [
    { kind: 'README', path: r.readme, status: r.readme ? 'found' : 'missing' },
    { kind: 'Manifest', path: MANIFEST_PATH, status: !manifest.present ? 'missing' : manifest.valid ? 'found' : 'invalid', detail: manifest.errors[0] },
    { kind: 'Architecture documentation', path: r.architectureDocs[0] ?? null, status: r.architectureDocs.length ? 'found' : 'missing' },
    { kind: 'Architecture diagram', path: r.diagrams[0] ?? null, status: r.diagrams.length ? 'found' : 'missing' },
    { kind: 'Screenshots', path: r.screenshots[0] ?? null, status: r.screenshots.length ? 'found' : 'missing', detail: r.screenshots.length ? `${r.screenshots.length} image(s)` : undefined },
  ]

  const brokenRefs: string[] = []
  if (manifest.data) {
    const refs = [
      ...manifest.data.screenshots.map((s) => s.path),
      manifest.data.architecture?.documentation,
      manifest.data.architecture?.diagram,
      manifest.data.documentation?.readme,
      ...manifest.data.mongodbCapabilities.flatMap((c) => c.evidence),
    ].filter((p): p is string => Boolean(p))
    for (const p of refs) if (!pathSet.has(p)) brokenRefs.push(p)
    if (brokenRefs.length) checks.push({ kind: 'Manifest references', path: null, status: 'invalid', detail: `Missing in repository: ${brokenRefs.slice(0, 5).join(', ')}` })
  }

  const hasEnhancement = r.architectureDocs.length > 0 || r.diagrams.length > 0 || r.screenshots.length > 0 || manifest.present
  const level: CompatibilityLevel = manifest.valid && brokenRefs.length === 0 && r.readme ? 'fully-compatible' : r.readme && hasEnhancement ? 'enhanced' : 'basic'

  const recommendations: string[] = []
  if (!r.readme) recommendations.push('Add a README.md with overview, prerequisites, installation and usage sections.')
  if (!manifest.present) recommendations.push(`Add ${MANIFEST_PATH} following Demo Hub standard v${STANDARD_VERSION} (use a prompt from Prepare Your Demo).`)
  else if (!manifest.valid) recommendations.push(`Fix manifest validation errors: ${manifest.errors.slice(0, 3).join('; ')}`)
  if (brokenRefs.length) recommendations.push('Update manifest paths so every referenced file exists in the repository.')
  if (!r.architectureDocs.length) recommendations.push('Add demo-hub/architecture.md describing components and data flow.')
  if (!r.diagrams.length) recommendations.push('Add a Mermaid diagram at demo-hub/diagrams/architecture.mmd.')
  if (!r.screenshots.length) recommendations.push('Add screenshots under demo-hub/screenshots/.')

  return { level, standardVersion: STANDARD_VERSION, assessedAt: (input.now ?? new Date()).toISOString(), manifest: { present: manifest.present, valid: manifest.valid, errors: manifest.errors }, resources: checks, recommendations }
}

// ---------- Deterministic capability detection ----------

export type DetectedCapability = { capability: CapabilityId; evidence: string; reason: string }

const DEPENDENCY_RULES: { re: RegExp; capability: CapabilityId; reason: string }[] = [
  { re: /["'\s](mongodb|mongoose|pymongo|motor|mongo-driver|mongodb-driver-sync|go\.mongodb\.org\/mongo-driver)["'\s=<>~^@]/i, capability: 'crud', reason: 'MongoDB driver dependency' },
  { re: /["'\s](voyageai|voyage-ai)["'\s=<>~^@]/i, capability: 'voyage-ai', reason: 'Voyage AI client dependency' },
  { re: /["'\s](kafkajs|confluent-kafka|kafka-python|@confluentinc\/kafka-javascript|spring-kafka)["'\s=<>~^@]/i, capability: 'kafka', reason: 'Kafka client dependency' },
]

const SOURCE_RULES: { re: RegExp; capability: CapabilityId; reason: string }[] = [
  { re: /\$vectorSearch/, capability: 'vector-search', reason: '$vectorSearch aggregation stage' },
  { re: /\$search\b|\$searchMeta/, capability: 'atlas-search', reason: '$search aggregation stage' },
  { re: /\.watch\s*\(/, capability: 'change-streams', reason: 'change stream .watch() call' },
  { re: /\.aggregate\s*\(|\$lookup|\$group/, capability: 'aggregation', reason: 'aggregation pipeline' },
  { re: /\$source\b[\s\S]{0,200}connectionName|sp\.process|streamProcessor/i, capability: 'stream-processing', reason: 'Atlas Stream Processing pipeline' },
  { re: /mongodb\+srv:\/\//, capability: 'atlas', reason: 'Atlas SRV connection string format' },
]

export function detectCapabilities(files: { path: string; content: string }[]): DetectedCapability[] {
  const found = new Map<CapabilityId, DetectedCapability>()
  for (const f of files) {
    const isManifest = /(package\.json|requirements\.txt|pyproject\.toml|go\.mod|pom\.xml|build\.gradle)$/i.test(f.path)
    const rules = isManifest ? DEPENDENCY_RULES : SOURCE_RULES
    for (const rule of rules) {
      if (!found.has(rule.capability) && rule.re.test(` ${f.content} `)) found.set(rule.capability, { capability: rule.capability, evidence: f.path, reason: rule.reason })
    }
  }
  return [...found.values()]
}

/** Source files worth scanning for capability evidence, most likely first. */
export function selectSourceFiles(paths: string[], max: number): string[] {
  const code = paths.filter((p) => /\.(ts|tsx|js|mjs|py|go|java|kt|cs)$/i.test(p) && !/(node_modules|dist|build|\.next|vendor|test|spec)\//i.test(p))
  const score = (p: string) => (/(mongo|db|search|vector|repositor|aggregat|stream|kafka|embed)/i.test(p) ? 0 : 1) + p.split('/').length / 100
  return code.sort((a, b) => score(a) - score(b)).slice(0, max)
}
