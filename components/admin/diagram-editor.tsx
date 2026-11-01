'use client'

import { useDeferredValue, useState } from 'react'
import { Button } from '@/components/lg'
import { MermaidDiagram } from '@/components/shared/mermaid-diagram'
import type { ArchitectureDiagram } from '@/lib/schemas/manifest'
import { TextAreaField, TextField, ToggleField } from './fields'

const STARTER = 'flowchart LR\n  App[Application] --> Atlas[(MongoDB Atlas)]'

export function DiagramEditor({ value, onChange }: { value: ArchitectureDiagram[]; onChange: (value: ArchitectureDiagram[]) => void }) {
  const [selected, setSelected] = useState(0)
  const current = value[selected]
  const deferredSource = useDeferredValue(current?.mermaid ?? '')

  function update(patch: Partial<ArchitectureDiagram>) {
    onChange(value.map((d, i) => (i === selected ? { ...d, ...patch } : d)))
  }

  function add() {
    const next = [...value, { id: `diagram-${Date.now().toString(36)}`, title: 'New diagram', description: '', mermaid: STARTER, provenance: 'catalog' as const, illustrative: true }]
    onChange(next)
    setSelected(next.length - 1)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {value.map((d, i) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setSelected(i)}
            aria-pressed={i === selected}
            className={`rounded-full border px-4 py-1.5 text-sm ${i === selected ? 'border-accent bg-accent/10 font-semibold text-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            {d.title}
          </button>
        ))}
        <Button size="small" onClick={add} disabled={value.length >= 10}>
          Add diagram
        </Button>
      </div>

      {current ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <TextField label="Title" required value={current.title} onChange={(title) => update({ title })} />
            <TextAreaField label="Explanation" rows={3} value={current.description} onChange={(description) => update({ description })} />
            <TextAreaField label="Mermaid source" mono rows={14} value={current.mermaid} onChange={(mermaid) => update({ mermaid })} description="Rendered with Mermaid in strict security mode." />
            <ToggleField
              label="Illustrative diagram"
              description="Label this diagram as illustrative rather than an exact depiction of a deployed system."
              checked={current.illustrative}
              onChange={(illustrative) => update({ illustrative })}
            />
            <div>
              <Button
                size="small"
                variant="dangerOutline"
                onClick={() => {
                  onChange(value.filter((_, i) => i !== selected))
                  setSelected(0)
                }}
              >
                Remove diagram
              </Button>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live preview</p>
            {deferredSource.trim() ? <MermaidDiagram source={deferredSource} title={current.title} /> : <p className="text-sm text-muted-foreground">Enter Mermaid source to preview.</p>}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No architecture diagrams yet.</p>
      )}
    </div>
  )
}
