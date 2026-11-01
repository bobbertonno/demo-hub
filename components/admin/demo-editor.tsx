'use client'

import LGModal from '@leafygreen-ui/modal'
import { Tab, Tabs } from '@/components/hub-tabs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type ComponentType, type ReactNode } from 'react'
import { Button } from '@/components/lg'
import { apiFetch, ApiError, describeError } from '@/lib/client/api'
import { DemoInput, type DemoStatus } from '@/lib/schemas/manifest'
import { CheckboxGroup, ListField, SelectField, TextAreaField, TextField, ToggleField } from './fields'
import { DiagramEditor } from './diagram-editor'
import { GalleryManager } from './gallery-manager'

const Modal = LGModal as unknown as ComponentType<{ open: boolean; setOpen: (open: boolean) => void; children: ReactNode }>

const MATURITY = ['concept', 'prototype', 'beta', 'stable', 'deprecated'] as const
const DIFFICULTY = ['beginner', 'intermediate', 'advanced'] as const
const DOC_STATUS = ['missing', 'template', 'partial', 'verified'] as const
const RUNTIME = ['local-demo', 'atlas-connected', 'hybrid'] as const
const THEME = ['mongodb', 'customer', 'custom'] as const

type Props = {
  initial: DemoInput
  isNew: boolean
  isAdmin: boolean
  writable: boolean
  canUpload: boolean
  sync?: { status: string; lastSuccessAt: string | null; lastError: string | null }
}

type Feedback = { tone: 'success' | 'error' | 'info'; text: string } | null

export function DemoEditor({ initial, isNew, isAdmin, writable, canUpload, sync }: Props) {
  const router = useRouter()
  const [draft, setDraft] = useState<DemoInput>(initial)
  const [savedSlug, setSavedSlug] = useState(isNew ? null : initial.slug)
  const [tab, setTab] = useState('overview')
  const [busy, setBusy] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [proposalNote, setProposalNote] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [advanced, setAdvanced] = useState(() => JSON.stringify(pickAdvanced(initial), null, 2))
  const [advancedError, setAdvancedError] = useState<string | null>(null)

  const set = <K extends keyof DemoInput>(key: K, value: DemoInput[K]) => setDraft((d) => ({ ...d, [key]: value }))

  function buildPayload(): DemoInput | null {
    let merged: DemoInput = draft
    try {
      merged = { ...draft, ...(JSON.parse(advanced) as Partial<DemoInput>) }
      setAdvancedError(null)
    } catch {
      setAdvancedError('Advanced JSON is not valid JSON.')
      setFeedback({ tone: 'error', text: 'Fix the Advanced JSON tab before saving.' })
      setTab('advanced')
      return null
    }
    const parsed = DemoInput.safeParse(merged)
    if (!parsed.success) {
      setFeedback({ tone: 'error', text: `Validation failed: ${parsed.error.issues.slice(0, 6).map((i) => `${i.path.join('.') || '(root)'} — ${i.message}`).join('; ')}` })
      return null
    }
    return parsed.data
  }

  async function save() {
    const payload = buildPayload()
    if (!payload) return
    setBusy('save')
    setFeedback(null)
    try {
      const url = savedSlug ? `/api/demos/${encodeURIComponent(savedSlug)}` : '/api/demos'
      const res = await apiFetch<{ demo?: { slug: string }; proposal?: { id: string } }>(url, {
        method: savedSlug ? 'PUT' : 'POST',
        body: JSON.stringify(isAdmin ? payload : { ...payload, proposalNote }),
      })
      if (res.proposal) {
        setFeedback({ tone: 'info', text: 'Submitted as a proposal. An admin must approve it before it changes the catalog.' })
      } else if (res.demo) {
        setFeedback({ tone: 'success', text: 'Saved.' })
        if (!savedSlug || res.demo.slug !== savedSlug) {
          setSavedSlug(res.demo.slug)
          router.replace(`/admin/demos/${res.demo.slug}`)
        }
        router.refresh()
      }
    } catch (err) {
      setFeedback({ tone: 'error', text: describeError(err) })
    } finally {
      setBusy(null)
    }
  }

  async function changeStatus(status: DemoStatus) {
    if (!savedSlug) return
    setBusy(status)
    setFeedback(null)
    try {
      await apiFetch(`/api/demos/${encodeURIComponent(savedSlug)}/status`, { method: 'POST', body: JSON.stringify({ status }) })
      set('status', status)
      setFeedback({ tone: 'success', text: `Status changed to ${status}.` })
      router.refresh()
    } catch (err) {
      setFeedback({ tone: 'error', text: describeError(err) })
    } finally {
      setBusy(null)
    }
  }

  async function syncNow() {
    if (!savedSlug) return
    setBusy('sync')
    setFeedback(null)
    try {
      await apiFetch(`/api/demos/${encodeURIComponent(savedSlug)}/sync`, { method: 'POST', body: JSON.stringify({}) })
      setFeedback({ tone: 'success', text: 'README synchronized from GitHub.' })
      router.refresh()
    } catch (err) {
      const text = err instanceof ApiError && err.status === 502 ? `GitHub sync failed; the last successful snapshot was preserved. ${err.message}` : describeError(err)
      setFeedback({ tone: 'error', text })
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  async function remove() {
    if (!savedSlug) return
    setBusy('delete')
    try {
      await apiFetch(`/api/demos/${encodeURIComponent(savedSlug)}`, { method: 'DELETE' })
      router.push('/admin')
      router.refresh()
    } catch (err) {
      setFeedback({ tone: 'error', text: describeError(err) })
      setBusy(null)
      setConfirmDelete(false)
    }
  }

  const disabled = !writable || busy !== null

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="text-sm text-muted-foreground">
          Status: <span className="font-semibold text-foreground">{draft.status}</span>
          {sync ? (
            <>
              {' · '}GitHub sync: <span className="font-semibold text-foreground">{sync.status}</span>
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {savedSlug ? (
            <Link href={`/demos/${savedSlug}`} target="_blank" className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface">
              Preview
            </Link>
          ) : null}
          {isAdmin && savedSlug ? (
            <>
              <Button size="small" disabled={disabled || !draft.repository} onClick={syncNow}>
                {busy === 'sync' ? 'Syncing…' : 'Sync README'}
              </Button>
              {draft.status !== 'published' ? (
                <Button size="small" disabled={disabled} onClick={() => changeStatus('published')}>
                  {busy === 'published' ? 'Publishing…' : 'Publish'}
                </Button>
              ) : (
                <Button size="small" disabled={disabled} onClick={() => changeStatus('draft')}>
                  Unpublish
                </Button>
              )}
              {draft.status !== 'archived' ? (
                <Button size="small" disabled={disabled} onClick={() => changeStatus('archived')}>
                  Archive
                </Button>
              ) : null}
              <Button size="small" variant="dangerOutline" disabled={disabled} onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            </>
          ) : null}
          <Button size="small" variant="primary" disabled={disabled} onClick={save}>
            {busy === 'save' ? 'Saving…' : isAdmin ? (isNew && !savedSlug ? 'Create demo' : 'Save changes') : 'Submit proposal'}
          </Button>
        </div>
      </div>

      {!writable ? (
        <p role="status" className="rounded-lg border border-border bg-surface p-4 text-sm text-foreground">
          Editing is disabled because no MongoDB database is configured. Changes cannot be saved in the read-only seed catalog.
        </p>
      ) : null}
      {feedback ? (
        <p
          role={feedback.tone === 'error' ? 'alert' : 'status'}
          className={`rounded-lg border p-4 text-sm ${feedback.tone === 'error' ? 'border-red-500/40 bg-red-500/10 text-foreground' : feedback.tone === 'success' ? 'border-accent/40 bg-accent/10 text-foreground' : 'border-border bg-surface text-foreground'}`}
        >
          {feedback.text}
        </p>
      ) : null}
      {sync?.lastError ? (
        <p role="alert" className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-foreground">
          Last sync error: {sync.lastError}
        </p>
      ) : null}

      <Tabs aria-label="Demo editor sections" value={tab} onValueChange={setTab}>
        <Tab name="Overview" value="overview">
          <Section>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Title" required value={draft.title} onChange={(v) => set('title', v)} />
              <TextField label="Slug" required value={draft.slug} onChange={(v) => setDraft((d) => ({ ...d, slug: v, id: isNew ? v : d.id }))} description="Lowercase letters, digits and hyphens" />
              <TextField label="Tagline" value={draft.tagline ?? ''} onChange={(v) => set('tagline', v || undefined)} />
              <TextField label="Industry" required value={draft.industry} onChange={(v) => set('industry', v)} />
              <TextField label="Category" value={draft.category ?? ''} onChange={(v) => set('category', v || undefined)} />
              <TextField label="Release version" value={draft.releaseVersion ?? ''} onChange={(v) => set('releaseVersion', v || null)} />
            </div>
            <TextAreaField label="Summary" value={draft.summary} onChange={(v) => set('summary', v)} />
            <TextAreaField label="Business problem" value={draft.businessProblem} onChange={(v) => set('businessProblem', v)} />
            <TextAreaField label="Solution / value proposition" value={draft.solution ?? ''} onChange={(v) => set('solution', v || undefined)} />
            <TextAreaField label="Example user journey" value={draft.userJourney} onChange={(v) => set('userJourney', v)} />
            <div className="grid gap-4 md:grid-cols-2">
              <ListField label="Tags" value={draft.tags} onChange={(v) => set('tags', v)} />
              <ListField label="Use cases" value={draft.useCases} onChange={(v) => set('useCases', v)} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <SelectField label="Maturity" value={draft.maturity} options={MATURITY} onChange={(v) => set('maturity', v)} />
              <SelectField label="Difficulty" value={draft.difficulty} options={DIFFICULTY} onChange={(v) => set('difficulty', v)} />
              <SelectField label="Documentation status" value={draft.documentationStatus} options={DOC_STATUS} onChange={(v) => set('documentationStatus', v)} />
            </div>
            <CheckboxGroup legend="Runtime modes" options={RUNTIME} value={draft.demoModes} onChange={(v) => set('demoModes', v)} />
            <div className="grid gap-4 md:grid-cols-3">
              <TextField label="Maintainer name" required value={draft.maintainer.name} onChange={(v) => set('maintainer', { ...draft.maintainer, name: v })} />
              <TextField label="Maintainer email" type="email" value={draft.maintainer.email ?? ''} onChange={(v) => set('maintainer', { ...draft.maintainer, email: v || undefined })} />
              <TextField label="Team" value={draft.maintainer.team ?? ''} onChange={(v) => set('maintainer', { ...draft.maintainer, team: v || undefined })} />
            </div>
            <ToggleField label="Featured on the landing page" checked={draft.featured} onChange={(v) => set('featured', v)} />
          </Section>
        </Tab>

        <Tab name="Repository" value="repository">
          <Section>
            <TextField
              label="GitHub repository URL"
              type="url"
              placeholder="https://github.com/<owner>/<repo>"
              value={draft.repository ?? ''}
              onChange={(v) => set('repository', v.trim() ? v.trim() : null)}
              description="Leave empty until the real repository URL is known. Never use an invented URL."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Default branch" value={draft.defaultBranch} onChange={(v) => set('defaultBranch', v)} />
              <TextField label="README path" value={draft.readmePath} onChange={(v) => set('readmePath', v)} />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The repository README is the primary source for installation instructions. Catalog metadata enriches but never overwrites it. Steps entered in the Advanced tab are shown as TEMPLATE until verified against the repository.
            </p>
            {isAdmin && savedSlug && draft.repository ? (
              <a href={`/api/demos/${savedSlug}/readme-patch`} className="w-fit text-sm font-medium text-accent underline underline-offset-4">
                Download suggested README patch
              </a>
            ) : null}
          </Section>
        </Tab>

        <Tab name="Theme" value="theme">
          <Section>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Theme metadata only describes how the demo itself is branded in its screenshots and documentation. The Demo Hub shell always uses MongoDB LeafyGreen.
            </p>
            <SelectField
              label="Demo theme mode"
              value={draft.themeMode}
              options={THEME}
              onChange={(v) => setDraft((d) => ({ ...d, themeMode: v, customerTheme: v === 'mongodb' ? undefined : (d.customerTheme ?? { name: '' }) }))}
            />
            {draft.themeMode !== 'mongodb' ? (
              <div className="grid gap-4 md:grid-cols-3">
                <TextField label="Customer / theme name" required value={draft.customerTheme?.name ?? ''} onChange={(v) => set('customerTheme', { ...(draft.customerTheme ?? { name: '' }), name: v })} />
                <TextField label="Primary color" placeholder="#RRGGBB" value={draft.customerTheme?.primaryColor ?? ''} onChange={(v) => set('customerTheme', { ...(draft.customerTheme ?? { name: '' }), primaryColor: v || undefined })} />
                <TextField label="Accent color" placeholder="#RRGGBB" value={draft.customerTheme?.accentColor ?? ''} onChange={(v) => set('customerTheme', { ...(draft.customerTheme ?? { name: '' }), accentColor: v || undefined })} />
              </div>
            ) : null}
          </Section>
        </Tab>

        <Tab name="Gallery" value="gallery">
          <Section>
            <GalleryManager slug={savedSlug ?? draft.slug} value={draft.screenshots} onChange={(v) => set('screenshots', v)} canUpload={canUpload && Boolean(savedSlug)} />
          </Section>
        </Tab>

        <Tab name="Architecture" value="architecture">
          <Section>
            <TextAreaField label="Architecture overview" rows={5} value={draft.architecture.overview} onChange={(v) => set('architecture', { ...draft.architecture, overview: v })} />
            <DiagramEditor value={draft.architecture.diagrams} onChange={(v) => set('architecture', { ...draft.architecture, diagrams: v })} />
          </Section>
        </Tab>

        <Tab name="Advanced JSON" value="advanced">
          <Section>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Capabilities, setup steps, configuration variables, troubleshooting, FAQ, facts and the remaining structured fields. Validated with the same Zod schema as the API.
            </p>
            <TextAreaField label="Structured fields (JSON)" mono rows={24} value={advanced} onChange={setAdvanced} />
            {advancedError ? (
              <p role="alert" className="text-sm text-red-600">
                {advancedError}
              </p>
            ) : null}
          </Section>
        </Tab>
      </Tabs>

      {!isAdmin ? <TextField label="Proposal note for reviewers" value={proposalNote} onChange={setProposalNote} /> : null}

      <Modal open={confirmDelete} setOpen={setConfirmDelete}>
        <h2 className="text-xl font-semibold text-foreground">Delete this demo?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This permanently removes <strong>{draft.title}</strong> from the catalog. The demo repository on GitHub is not affected. Consider archiving instead.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button variant="danger" disabled={busy === 'delete'} onClick={remove}>
            {busy === 'delete' ? 'Deleting…' : 'Delete demo'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function Section({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-5 pt-6">{children}</div>
}

const ADVANCED_KEYS = [
  'capabilities',
  'prerequisites',
  'localSetup',
  'atlasSetup',
  'configuration',
  'walkthrough',
  'troubleshooting',
  'faq',
  'limitations',
  'securityNotes',
  'contributionGuide',
  'setupWizard',
  'repositoryFiles',
  'facts',
  'interactiveExperience',
  'verificationTimestamp',
] as const

function pickAdvanced(d: DemoInput) {
  return Object.fromEntries(ADVANCED_KEYS.map((k) => [k, d[k]]))
}
