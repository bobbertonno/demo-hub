'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/lg'
import { apiFetch, describeError } from '@/lib/client/api'
import type { CatalogSettings } from '@/lib/catalog/settings'
import { TextField, ToggleField } from './fields'

const FLAGS: { key: keyof CatalogSettings['featureFlags']; label: string; description: string }[] = [
  { key: 'webinarMode', label: 'Webinar presentation mode', description: 'Expose large-diagram presentation views on interactive demos.' },
  { key: 'readmePatches', label: 'README patch suggestions', description: 'Allow admins to download suggested README patches. Patches are never pushed automatically.' },
  { key: 'contributorProposals', label: 'Contributor proposals', description: 'Allow contributors to submit catalog changes for admin review.' },
  { key: 'scheduledSync', label: 'Scheduled GitHub sync', description: 'Accept authenticated calls to the scheduled sync endpoint.' },
]

export function SettingsForm({ initial, writable }: { initial: CatalogSettings; writable: boolean }) {
  const router = useRouter()
  const [settings, setSettings] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function save() {
    setBusy(true)
    setMessage(null)
    try {
      const { updatedAt: _a, updatedBy: _b, ...payload } = settings
      const res = await apiFetch<{ settings: CatalogSettings }>('/api/settings', { method: 'PUT', body: JSON.stringify(payload) })
      setSettings(res.settings)
      setMessage({ ok: true, text: 'Settings saved.' })
      router.refresh()
    } catch (err) {
      setMessage({ ok: false, text: describeError(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ToggleField
        label="Show drafts in the public catalog"
        description="When off, draft entries are only visible to contributors and admins."
        checked={settings.showDraftsInCatalog}
        onChange={(v) => setSettings((s) => ({ ...s, showDraftsInCatalog: v }))}
      />
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Feature flags</legend>
        {FLAGS.map((f) => (
          <ToggleField
            key={f.key}
            label={f.label}
            description={f.description}
            checked={settings.featureFlags[f.key]}
            onChange={(v) => setSettings((s) => ({ ...s, featureFlags: { ...s.featureFlags, [f.key]: v } }))}
          />
        ))}
      </fieldset>
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Appearance metadata</legend>
        <p className="text-sm text-muted-foreground">Text metadata only. The Hub shell always renders with MongoDB LeafyGreen.</p>
        <TextField label="Hub name" required value={settings.appearance.hubName} onChange={(v) => setSettings((s) => ({ ...s, appearance: { ...s.appearance, hubName: v } }))} />
        <TextField label="Tagline" value={settings.appearance.tagline} onChange={(v) => setSettings((s) => ({ ...s, appearance: { ...s.appearance, tagline: v } }))} />
        <TextField label="Support contact" value={settings.appearance.supportContact} onChange={(v) => setSettings((s) => ({ ...s, appearance: { ...s.appearance, supportContact: v } }))} />
      </fieldset>
      {message ? (
        <p role={message.ok ? 'status' : 'alert'} className={`text-sm ${message.ok ? 'text-accent' : 'text-red-600'}`}>
          {message.text}
        </p>
      ) : null}
      <div>
        <Button variant="primary" disabled={!writable || busy} onClick={save}>
          {busy ? 'Saving…' : 'Save settings'}
        </Button>
        {!writable ? <p className="mt-2 text-sm text-muted-foreground">Settings are read-only until MongoDB is configured.</p> : null}
      </div>
    </div>
  )
}
