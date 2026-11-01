'use client'

import Badge from '@leafygreen-ui/badge'
import Modal from '@leafygreen-ui/modal'
import { useState } from 'react'
import { CodeSnippet } from '@/components/shared/code-snippet'
import { MermaidDiagram } from '@/components/shared/mermaid-diagram'
import { ProvenanceBadge } from '@/components/shared/status-badges'
import type { ArchitectureDiagram } from '@/lib/schemas/manifest'

export function ArchitecturePanel({ diagram, editHref }: { diagram: ArchitectureDiagram; editHref?: string }) {
  const [showSource, setShowSource] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  return (
    <article className="flex flex-col gap-4 rounded-xl border p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{diagram.title}</h3>
          <ProvenanceBadge provenance={diagram.provenance} />
          {diagram.illustrative && <Badge variant="lightgray">Illustrative</Badge>}
        </div>
        <div className="flex gap-2 text-sm">
          <button type="button" onClick={() => setShowSource((v) => !v)} aria-pressed={showSource} className="rounded-md border px-3 py-1.5 hover:bg-surface">
            {showSource ? 'Hide source' : 'View source'}
          </button>
          <button type="button" onClick={() => setFullscreen(true)} className="rounded-md border px-3 py-1.5 hover:bg-surface">
            Full screen
          </button>
          {editHref && (
            <a href={editHref} className="rounded-md border px-3 py-1.5 hover:bg-surface">
              Edit
            </a>
          )}
        </div>
      </header>
      {diagram.description && <p className="text-sm leading-relaxed text-muted-foreground">{diagram.description}</p>}
      <MermaidDiagram source={diagram.mermaid} title={diagram.title} />
      {showSource && <CodeSnippet code={diagram.mermaid} language="none" label={`${diagram.title} Mermaid source`} />}
      <Modal open={fullscreen} setOpen={setFullscreen} size="large">
        <h2 className="mb-4 text-xl font-semibold">{diagram.title}</h2>
        <MermaidDiagram source={diagram.mermaid} title={diagram.title} className="min-h-[60vh]" />
      </Modal>
    </article>
  )
}
