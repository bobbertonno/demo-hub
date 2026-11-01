import { z } from 'zod'

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const capabilityIds = [
  'atlas',
  'crud',
  'aggregation',
  'atlas-search',
  'vector-search',
  'voyage-ai',
  'change-streams',
  'stream-processing',
  'kafka',
  'online-archive',
  'sharding',
  'atlas-infinite',
] as const
export const CapabilityId = z.enum(capabilityIds)
export type CapabilityId = z.infer<typeof CapabilityId>

export const Maturity = z.enum(['concept', 'prototype', 'beta', 'stable', 'deprecated'])
export const Difficulty = z.enum(['beginner', 'intermediate', 'advanced'])
export const RuntimeMode = z.enum(['local-demo', 'atlas-connected', 'hybrid', 'interactive-educational'])
export const DemoStatus = z.enum(['draft', 'in_review', 'published', 'archived'])
export const DocumentationStatus = z.enum(['missing', 'template', 'partial', 'verified'])
export const ThemeMode = z.enum(['mongodb', 'customer', 'custom'])
export const Provenance = z.enum(['repository', 'catalog', 'template'])

export type DemoStatus = z.infer<typeof DemoStatus>
export type Maturity = z.infer<typeof Maturity>
export type RuntimeMode = z.infer<typeof RuntimeMode>
export type Difficulty = z.infer<typeof Difficulty>
export type ThemeMode = z.infer<typeof ThemeMode>
export type Provenance = z.infer<typeof Provenance>

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Expected #RRGGBB')

/** Only https URLs; blocks credentials-in-URL and non-standard ports. */
export const SafeHttpsUrl = z
  .string()
  .url()
  .refine((value) => {
    try {
      const u = new URL(value)
      return u.protocol === 'https:' && !u.username && !u.password && (u.port === '' || u.port === '443')
    } catch {
      return false
    }
  }, 'Must be an https URL without credentials or custom ports')

export const GithubRepoUrl = SafeHttpsUrl.refine((value) => {
  const u = new URL(value)
  return u.hostname === 'github.com' && /^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(u.pathname.replace(/\.git$/, ''))
}, 'Must be a https://github.com/<owner>/<repo> URL')

export const CustomerTheme = z.object({
  name: z.string().min(1).max(80),
  primaryColor: hexColor.optional(),
  accentColor: hexColor.optional(),
  logoAssetId: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
})

export const CapabilityMapping = z.object({
  capability: CapabilityId,
  whyUsed: z.string().min(1).max(600),
  implementationLocation: z.string().max(300).optional(),
  businessValue: z.string().max(600).optional(),
  verified: z.boolean().default(false),
})
export type CapabilityMapping = z.infer<typeof CapabilityMapping>

export const SetupStep = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
  command: z.string().max(4000).optional(),
  language: z.enum(['bash', 'shell', 'yaml', 'json', 'javascript', 'typescript', 'python', 'none']).default('bash'),
  provenance: Provenance.default('template'),
  sourcePath: z.string().max(300).optional(),
})
export type SetupStep = z.infer<typeof SetupStep>

export const ConfigVariable = z.object({
  name: z.string().regex(/^[A-Z][A-Z0-9_]*$/, 'UPPER_SNAKE_CASE expected'),
  description: z.string().max(600),
  required: z.boolean().default(false),
  secret: z.boolean().default(false),
  example: z.string().max(200).optional(),
  modes: z.array(z.enum(['local-demo', 'atlas-connected'])).default([]),
})
export type ConfigVariable = z.infer<typeof ConfigVariable>

export const Screenshot = z.object({
  id: z.string().min(1).max(120),
  url: SafeHttpsUrl.or(z.string().regex(/^\/api\/assets\/[a-zA-Z0-9_-]+$/)),
  caption: z.string().max(300),
  alt: z.string().max(300),
  order: z.number().int().min(0).default(0),
  provenance: Provenance.default('catalog'),
})
export type Screenshot = z.infer<typeof Screenshot>

export const ArchitectureDiagram = z.object({
  id: z.string().min(1).max(120),
  title: z.string().min(1).max(160),
  description: z.string().max(4000).default(''),
  mermaid: z.string().min(1).max(20000),
  provenance: Provenance.default('catalog'),
  illustrative: z.boolean().default(true),
})
export type ArchitectureDiagram = z.infer<typeof ArchitectureDiagram>

export const Maintainer = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional(),
  team: z.string().max(120).optional(),
})

export const FaqItem = z.object({ question: z.string().max(300), answer: z.string().max(3000) })

/** Versioned, admin-editable fact with explicit verification status. */
export const FactEntry = z.object({
  key: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().max(160),
  value: z.string().max(1000),
  kind: z.enum(['assumption', 'measured', 'product-fact']),
  verificationStatus: z.enum(['unverified', 'verified', 'outdated']),
  source: SafeHttpsUrl.optional(),
  version: z.number().int().min(1).default(1),
  updatedAt: z.string().optional(),
})
export type FactEntry = z.infer<typeof FactEntry>

/** demo.yaml manifest — the contract a demo repository can publish. */
export const DemoManifest = z.object({
  id: z.string().min(1).max(80),
  slug: z.string().regex(SLUG_PATTERN).max(80),
  title: z.string().min(1).max(120),
  tagline: z.string().max(200).optional(),
  summary: z.string().min(1).max(1200),
  businessProblem: z.string().max(4000),
  solution: z.string().max(4000).optional(),
  industry: z.string().min(1).max(80),
  category: z.string().max(120).optional(),
  useCases: z.array(z.string().max(80)).max(20).default([]),
  tags: z.array(z.string().max(40)).max(30).default([]),
  capabilities: z.array(CapabilityMapping).max(20).default([]),
  architecture: z.object({
    overview: z.string().max(6000).default(''),
    dataFlow: z.array(z.string().max(600)).max(30).default([]),
    diagrams: z.array(ArchitectureDiagram).max(10).default([]),
  }),
  screenshots: z.array(Screenshot).max(40).default([]),
  repository: GithubRepoUrl.nullable(),
  defaultBranch: z.string().max(120).default('main'),
  readmePath: z.string().max(300).default('README.md'),
  prerequisites: z.array(z.object({ name: z.string().max(120), version: z.string().max(60).optional(), check: z.string().max(300).optional() })).default([]),
  localSetup: z.array(SetupStep).default([]),
  atlasSetup: z.array(SetupStep).default([]),
  configuration: z.array(ConfigVariable).default([]),
  demoModes: z.array(RuntimeMode).min(1),
  themeMode: ThemeMode.default('mongodb'),
  customerTheme: CustomerTheme.optional(),
  maintainer: Maintainer,
  maturity: Maturity,
  difficulty: Difficulty.default('intermediate'),
  documentationStatus: DocumentationStatus,
  verificationTimestamp: z.string().datetime().nullable(),
  releaseVersion: z.string().max(40).nullable(),
})
export type DemoManifest = z.infer<typeof DemoManifest>

export const SyncState = z.object({
  status: z.enum(['never', 'ok', 'error', 'stale', 'not-configured']),
  lastAttemptAt: z.string().nullable(),
  lastSuccessAt: z.string().nullable(),
  lastError: z.string().nullable(),
  commitSha: z.string().nullable(),
  ref: z.string().nullable(),
})
export type SyncState = z.infer<typeof SyncState>

/** Full catalog record stored in the `demos` collection. */
export const DemoRecord = DemoManifest.extend({
  status: DemoStatus,
  walkthrough: z.array(z.string().max(1000)).default([]),
  userJourney: z.string().max(4000).default(''),
  troubleshooting: z.array(FaqItem).default([]),
  faq: z.array(FaqItem).default([]),
  limitations: z.array(z.string().max(600)).default([]),
  securityNotes: z.array(z.string().max(600)).default([]),
  contributionGuide: z.string().max(4000).default(''),
  setupWizard: z.string().max(3000).nullable().default(null),
  repositoryFiles: z.array(z.object({ label: z.string().max(120), path: z.string().max(300) })).default([]),
  facts: z.array(FactEntry).default([]),
  featured: z.boolean().default(false),
  interactiveExperience: z.enum(['atlas-infinite']).nullable().default(null),
  sync: SyncState,
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type DemoRecord = z.infer<typeof DemoRecord>

/** Editable subset admins/contributors submit through forms. */
export const DemoInput = DemoRecord.omit({ sync: true, createdAt: true, updatedAt: true })
export type DemoInput = z.infer<typeof DemoInput>
