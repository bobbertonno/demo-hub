import type { Metadata } from 'next'
import { AccessState } from '@/components/admin/access-state'
import { AdminShell } from '@/components/admin/admin-shell'
import { DemoEditor } from '@/components/admin/demo-editor'
import { checkPageRole } from '@/lib/auth/session'
import { getCatalogMode } from '@/lib/catalog/repository'
import type { DemoInput } from '@/lib/schemas/manifest'

export const metadata: Metadata = { title: 'Register a demo', robots: { index: false } }
export const dynamic = 'force-dynamic'

const BLANK: DemoInput = {
  id: '',
  slug: '',
  title: '',
  summary: '',
  businessProblem: '',
  industry: '',
  useCases: [],
  tags: [],
  capabilities: [],
  architecture: { overview: '', dataFlow: [], diagrams: [] },
  screenshots: [],
  repository: null,
  defaultBranch: 'main',
  readmePath: 'README.md',
  prerequisites: [],
  localSetup: [],
  atlasSetup: [],
  configuration: [],
  demoModes: ['local-demo'],
  themeMode: 'mongodb',
  maintainer: { name: '' },
  maturity: 'prototype',
  difficulty: 'intermediate',
  documentationStatus: 'missing',
  verificationTimestamp: null,
  releaseVersion: null,
  status: 'draft',
  walkthrough: [],
  userJourney: '',
  troubleshooting: [],
  faq: [],
  limitations: [],
  securityNotes: [],
  contributionGuide: '',
  setupWizard: null,
  repositoryFiles: [],
  facts: [],
  featured: false,
  interactiveExperience: null,
}

export default async function NewDemoPage() {
  const access = await checkPageRole('contributor')
  if (!access.ok) return <AccessState reason={access.reason} path="/admin/demos/new" />
  const mode = getCatalogMode()
  return (
    <AdminShell
      user={access.user}
      mode={mode}
      active="/admin/demos/new"
      title="Register a demo"
      description="New entries start as drafts. Add the real GitHub repository URL, then synchronize its README to source verified setup instructions."
    >
      <DemoEditor initial={BLANK} isNew isAdmin={access.user.role === 'admin'} writable={mode === 'database'} canUpload={false} />
    </AdminShell>
  )
}
