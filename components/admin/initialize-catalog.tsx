'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/lg'
import { apiFetch, describeError } from '@/lib/client/api'

type Result = { migrationsApplied: string[]; demosInserted: number; demosAlreadyPresent: number; capabilitiesInserted: number }

export function InitializeCatalog({ empty }: { empty: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function run() {
    setBusy(true)
    setMessage(null)
    try {
      const r = await apiFetch<Result>('/api/admin/initialize', { method: 'POST', body: JSON.stringify({}) })
      setMessage({
        ok: true,
        text: `Done. ${r.migrationsApplied.length} migration(s) applied, ${r.demosInserted} demo(s) and ${r.capabilitiesInserted} capability definition(s) inserted. Existing entries were left unchanged.`,
      })
      router.refresh()
    } catch (err) {
      setMessage({ ok: false, text: describeError(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      aria-labelledby="init-heading"
      className={`mb-6 rounded-xl border p-5 ${empty ? 'border-leaf/60 bg-leaf/10' : 'border-border bg-card'}`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h2 id="init-heading" className="text-base font-semibold text-foreground">
            {empty ? 'Initialize the MongoDB catalog' : 'MongoDB catalog connected'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {empty
              ? 'The connected database is empty. Initialize it to create indexes and insert the four DRAFT seed demos and capability definitions. You can then edit, publish and sync them, and every change is persisted in MongoDB.'
              : 'Edits are persisted in MongoDB. Re-running initialization is safe: it applies pending index migrations and only inserts seed entries that are missing, without overwriting your edits.'}
          </p>
        </div>
        <Button variant={empty ? 'primary' : 'default'} disabled={busy} onClick={run}>
          {busy ? 'Initializing…' : empty ? 'Initialize catalog' : 'Re-run initialization'}
        </Button>
      </div>
      {message ? (
        <p role={message.ok ? 'status' : 'alert'} className={`mt-3 text-sm ${message.ok ? 'text-foreground' : 'text-red-600'}`}>
          {message.text}
        </p>
      ) : null}
    </section>
  )
}
