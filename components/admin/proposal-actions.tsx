'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/lg'
import { apiFetch, describeError } from '@/lib/client/api'

export function ProposalActions({ id }: { id: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState<null | 'approved' | 'rejected'>(null)
  const [error, setError] = useState<string | null>(null)

  async function decide(decision: 'approved' | 'rejected') {
    setBusy(decision)
    setError(null)
    try {
      await apiFetch(`/api/proposals/${encodeURIComponent(id)}`, { method: 'POST', body: JSON.stringify({ decision, note: '' }) })
      router.refresh()
    } catch (err) {
      setError(describeError(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button size="xsmall" variant="primary" disabled={busy !== null} onClick={() => decide('approved')}>
          {busy === 'approved' ? 'Approving…' : 'Approve'}
        </Button>
        <Button size="xsmall" variant="dangerOutline" disabled={busy !== null} onClick={() => decide('rejected')}>
          {busy === 'rejected' ? 'Rejecting…' : 'Reject'}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}
