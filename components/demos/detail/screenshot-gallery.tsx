'use client'

import Modal from '@leafygreen-ui/modal'
import { useCallback, useState } from 'react'
import type { Screenshot } from '@/lib/schemas/manifest'

export function ScreenshotGallery({ screenshots }: { screenshots: Screenshot[] }) {
  const sorted = [...screenshots].sort((a, b) => a.order - b.order)
  const [index, setIndex] = useState<number | null>(null)
  const current = index === null ? null : sorted[index]
  const step = useCallback((delta: number) => setIndex((i) => (i === null ? i : (i + delta + sorted.length) % sorted.length)), [sorted.length])

  if (!sorted.length) {
    return (
      <div className="rounded-xl border border-dashed bg-surface p-8 text-center">
        <p className="font-semibold">No screenshots yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Screenshots appear after a repository sync or when an admin uploads them. None are invented.</p>
      </div>
    )
  }

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((s, i) => (
          <li key={s.id}>
            <button type="button" onClick={() => setIndex(i)} className="group block w-full overflow-hidden rounded-xl border text-left">
              {/* eslint-disable-next-line @next/next/no-img-element -- sources are validated repository/asset URLs of unknown dimensions */}
              <img src={s.url} alt={s.alt} className="aspect-video w-full object-cover transition-transform group-hover:scale-[1.02]" loading="lazy" />
              <span className="block p-3 text-sm text-muted-foreground">{s.caption}</span>
            </button>
          </li>
        ))}
      </ul>
      <Modal open={current !== null} setOpen={(o: boolean) => { if (!o) setIndex(null) }} size="large">
        {current && (
          <figure
            className="flex flex-col gap-3"
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') step(1)
              if (e.key === 'ArrowLeft') step(-1)
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
            <img src={current.url} alt={current.alt} className="max-h-[70vh] w-full rounded-lg object-contain" />
            <figcaption className="flex items-center justify-between gap-4 text-sm">
              <span>{current.caption}</span>
              {sorted.length > 1 && (
                <span className="flex gap-2">
                  <button type="button" onClick={() => step(-1)} className="rounded border px-3 py-1">Previous</button>
                  <button type="button" onClick={() => step(1)} className="rounded border px-3 py-1">Next</button>
                </span>
              )}
            </figcaption>
          </figure>
        )}
      </Modal>
    </>
  )
}
