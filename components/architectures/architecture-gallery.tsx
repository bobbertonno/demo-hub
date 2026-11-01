'use client'

import Modal from '@leafygreen-ui/modal'
import Link from 'next/link'
import { useState } from 'react'
import { MermaidDiagram } from '@/components/shared/mermaid-diagram'

export type GalleryDiagram = {
  key: string
  demoSlug: string
  demoTitle: string
  title: string
  description: string
  mermaid: string
  illustrative: boolean
  provenance: string
}

export function ArchitectureGallery({ diagrams }: { diagrams: GalleryDiagram[] }) {
  const [view, setView] = useState<'gallery' | 'compare'>('gallery')
  const [fullscreen, setFullscreen] = useState<GalleryDiagram | null>(null)
  const [left, setLeft] = useState(diagrams[0]?.key ?? '')
  const [right, setRight] = useState(diagrams[1]?.key ?? diagrams[0]?.key ?? '')
  const byKey = new Map(diagrams.map((d) => [d.key, d]))

  return (
    <div className="flex flex-col gap-8">
      <div role="tablist" aria-label="Gallery view" className="inline-flex w-fit rounded-lg border bg-surface p-1">
        {(['gallery', 'compare'] as const).map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize focus-visible:outline-2 focus-visible:outline-leaf-dark ${view === v ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
          >
            {v === 'gallery' ? 'Gallery' : 'Compare side by side'}
          </button>
        ))}
      </div>

      {view === 'gallery' ? (
        <ul className="grid gap-6 lg:grid-cols-2">
          {diagrams.map((d) => (
            <li key={d.key}>
              <DiagramCard diagram={d} onFullscreen={() => setFullscreen(d)} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {[
            { value: left, set: setLeft, label: 'Left diagram' },
            { value: right, set: setRight, label: 'Right diagram' },
          ].map((side) => {
            const d = byKey.get(side.value)
            return (
              <div key={side.label} className="flex flex-col gap-3">
                <label className="text-sm font-medium">
                  {side.label}
                  <select
                    value={side.value}
                    onChange={(e) => side.set(e.target.value)}
                    className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    {diagrams.map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.demoTitle} — {o.title}
                      </option>
                    ))}
                  </select>
                </label>
                {d && <DiagramCard diagram={d} onFullscreen={() => setFullscreen(d)} />}
              </div>
            )
          })}
        </div>
      )}

      <Modal open={fullscreen !== null} setOpen={(o: boolean) => { if (!o) setFullscreen(null) }} size="large">
        {fullscreen && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">{fullscreen.title}</h2>
            <MermaidDiagram source={fullscreen.mermaid} title={fullscreen.title} className="min-h-[60vh]" />
            <p className="text-sm leading-relaxed text-muted-foreground">{fullscreen.description}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}

function DiagramCard({ diagram, onFullscreen }: { diagram: GalleryDiagram; onFullscreen: () => void }) {
  return (
    <article className="flex h-full flex-col gap-4 rounded-xl border bg-background p-5 shadow-sm" data-testid="architecture-card">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/demos/${diagram.demoSlug}#architecture`} className="text-xs font-semibold uppercase tracking-wide text-accent hover:underline">
            {diagram.demoTitle}
          </Link>
          <h3 className="mt-1 text-lg font-semibold">{diagram.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {diagram.illustrative && <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium">Illustrative</span>}
          <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium capitalize">Source: {diagram.provenance}</span>
        </div>
      </header>
      <MermaidDiagram source={diagram.mermaid} title={diagram.title} className="min-h-64" />
      <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{diagram.description}</p>
      <button
        type="button"
        onClick={onFullscreen}
        className="w-fit rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-surface focus-visible:outline-2 focus-visible:outline-leaf-dark"
      >
        View full screen
      </button>
    </article>
  )
}
