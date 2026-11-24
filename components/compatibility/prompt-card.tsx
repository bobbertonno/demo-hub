'use client'

import { Check, ChevronDown, Copy, ExternalLink } from 'lucide-react'
import { useState } from 'react'

export function PromptCard({ id, name, description, prompt, openUrl, openLabel, version }: { id: string; name: string; description: string; prompt: string; openUrl: string; openLabel: string; version: string }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <article data-testid={`prompt-${id}`} className="flex flex-col gap-4 rounded-xl border bg-background p-5 shadow-sm">
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">{name}</h3>
          <span className="rounded-md bg-surface px-2 py-0.5 font-mono text-xs text-muted-foreground">v{version}</span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </header>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copy} className="inline-flex items-center gap-2 rounded-md bg-leaf px-3 py-2 text-sm font-semibold text-forest hover:bg-[#71F6BA]">
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? 'Copied' : 'Copy prompt'}
        </button>
        <a href={openUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-surface">
          {openLabel}
          <ExternalLink className="size-3.5" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={`prompt-body-${id}`}
          className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-surface"
        >
          {expanded ? 'Collapse' : 'Expand'}
          <ChevronDown className={`size-4 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden />
        </button>
      </div>
      <span role="status" className="sr-only">{copied ? `${name} prompt copied to clipboard` : ''}</span>
      <pre
        id={`prompt-body-${id}`}
        tabIndex={0}
        aria-label={`${name} prompt`}
        className={`overflow-auto whitespace-pre-wrap rounded-lg bg-surface p-4 font-mono text-xs leading-relaxed ${expanded ? 'max-h-[36rem]' : 'max-h-40'}`}
      >
        {prompt}
      </pre>
    </article>
  )
}
