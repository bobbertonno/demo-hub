'use client'

import { useState } from 'react'

type Result = { valid: boolean; errors: string[] }

export function ManifestValidator() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [busy, setBusy] = useState(false)

  async function validate() {
    setBusy(true)
    try {
      const res = await fetch('/api/compatibility/validate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ manifest: text }) })
      const body = await res.json()
      setResult(res.ok ? body : { valid: false, errors: [body.error ?? 'Validation request failed'] })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="manifest-input" className="text-sm font-medium">
        Paste demo-hub/manifest.json
      </label>
      <textarea
        id="manifest-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        spellCheck={false}
        className="rounded-lg border bg-background p-3 font-mono text-xs"
        placeholder='{ "schemaVersion": "1.0", "name": "...", "description": "..." }'
      />
      <button type="button" onClick={validate} disabled={busy || !text.trim()} className="self-start rounded-md bg-forest px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-leaf dark:text-forest">
        {busy ? 'Validating…' : 'Validate manifest'}
      </button>
      {result && (
        <div role={result.valid ? 'status' : 'alert'} className={`rounded-lg border p-3 text-sm ${result.valid ? 'border-leaf bg-leaf/10' : 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100'}`}>
          {result.valid ? (
            <p className="font-medium">Manifest is valid for Demo Hub standard v1.</p>
          ) : (
            <ul className="list-disc space-y-1 pl-5">
              {result.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
