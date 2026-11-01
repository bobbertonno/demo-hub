'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/lg'
import { apiFetch, describeError } from '@/lib/client/api'
import type { Screenshot } from '@/lib/schemas/manifest'

const ACCEPT = 'image/png,image/jpeg,image/webp'
const MAX_BYTES = 5 * 1024 * 1024

function reorder(list: Screenshot[], from: number, to: number): Screenshot[] {
  const next = [...list]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next.map((s, i) => ({ ...s, order: i }))
}

export function GalleryManager({
  slug,
  value,
  onChange,
  canUpload,
}: {
  slug: string
  value: Screenshot[]
  onChange: (value: Screenshot[]) => void
  canUpload: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sorted = [...value].sort((a, b) => a.order - b.order)

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    setUploading(true)
    const added: Screenshot[] = []
    try {
      for (const file of Array.from(files)) {
        if (!ACCEPT.split(',').includes(file.type)) throw new Error(`${file.name}: only PNG, JPEG or WebP are accepted`)
        if (file.size > MAX_BYTES) throw new Error(`${file.name}: exceeds 5 MB`)
        const form = new FormData()
        form.set('slug', slug)
        form.set('kind', 'screenshot')
        form.set('file', file)
        const { asset } = await apiFetch<{ asset: { id: string; url: string } }>('/api/assets', { method: 'POST', body: form })
        added.push({ id: asset.id, url: asset.url, caption: '', alt: file.name.replace(/\.[a-z]+$/i, ''), order: sorted.length + added.length, provenance: 'catalog' })
      }
    } catch (err) {
      setError(describeError(err))
    } finally {
      if (added.length) onChange([...sorted, ...added])
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function update(index: number, patch: Partial<Screenshot>) {
    onChange(sorted.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-surface p-5">
        <div>
          <p className="font-semibold text-foreground">Screenshots</p>
          <p className="text-sm text-muted-foreground">
            PNG, JPEG or WebP up to 5 MB. Files are signature-checked on the server and stored in the configured object store. Saved with the demo.
          </p>
        </div>
        <input ref={inputRef} type="file" accept={ACCEPT} multiple className="sr-only" id="gallery-upload" onChange={(e) => upload(e.target.files)} disabled={!canUpload || uploading} />
        <Button variant="primaryOutline" disabled={!canUpload || uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? 'Uploading…' : 'Upload images'}
        </Button>
      </div>
      {!canUpload ? <p className="text-sm text-muted-foreground">Uploads need an admin role, a saved demo, MongoDB and a configured object store (BLOB_READ_WRITE_TOKEN).</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No screenshots yet. Never add placeholder or invented screenshots — use real captures from the demo.</p>
      ) : (
        <ol className="flex flex-col gap-3" aria-label="Screenshot order">
          {sorted.map((s, i) => (
            <li
              key={s.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== i) onChange(reorder(sorted, dragIndex, i))
                setDragIndex(null)
              }}
              className={`flex flex-col gap-4 rounded-xl border bg-background p-4 md:flex-row ${dragIndex === i ? 'border-accent' : 'border-border'}`}
            >
              <div className="flex items-start gap-3">
                <span aria-hidden className="cursor-grab select-none pt-1 font-mono text-muted-foreground">
                  ⋮⋮
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element -- authenticated asset route, not optimizable */}
                <img src={s.url} alt={s.alt} className="h-24 w-40 rounded-md border border-border object-cover" />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">
                  Caption
                  <input className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-normal" value={s.caption} onChange={(e) => update(i, { caption: e.target.value })} />
                </label>
                <label className="text-sm font-semibold text-foreground">
                  Alt text
                  <input className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-normal" value={s.alt} onChange={(e) => update(i, { alt: e.target.value })} />
                </label>
              </div>
              <div className="flex gap-2 md:flex-col">
                <Button size="xsmall" disabled={i === 0} onClick={() => onChange(reorder(sorted, i, i - 1))} aria-label={`Move screenshot ${i + 1} up`}>
                  Up
                </Button>
                <Button size="xsmall" disabled={i === sorted.length - 1} onClick={() => onChange(reorder(sorted, i, i + 1))} aria-label={`Move screenshot ${i + 1} down`}>
                  Down
                </Button>
                <Button size="xsmall" variant="dangerOutline" onClick={() => onChange(reorder(sorted.filter((_, j) => j !== i), 0, 0))}>
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
