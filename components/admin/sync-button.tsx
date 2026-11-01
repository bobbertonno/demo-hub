'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/lg'
import { apiFetch, ApiError, describeError } from '@/lib/client/api'

export function SyncButton({ slug, disabled }: { slug: string; disabled?: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function run() {
    setBusy(true)
    setMessage(null)
    try {
      const res = await apiFetch<{ job: { status: string }; warning?: string }>(`/api/demos/${encodeURIComponent(slug)}/sync`, { method: 'POST', body: JSON.stringify({}) })
      setMessage({ ok: true, text: res.warning ?? (res.job.status === 'not-modified' ? 'Not modified' : 'Synchronized') })
    } catch (err) {
      setMessage({ ok: false, text: err instanceof ApiError && err.status === 502 ? `Failed; last snapshot kept. ${err.message}` : describeError(err) })
    } finally {
      setBusy(false)
      router.refresh()
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="xsmall" disabled={disabled || busy} onClick={run}>
        {busy ? 'Syncing…' : 'Sync now'}
      </Button>
      {message ? (
        <p role={message.ok ? 'status' : 'alert'} className={`max-w-xs text-right text-xs ${message.ok ? 'text-muted-foreground' : 'text-red-600'}`}>
          {message.text}
        </p>
      ) : null}
    </div>
  )
}
