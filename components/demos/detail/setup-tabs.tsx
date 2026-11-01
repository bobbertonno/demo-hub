'use client'

import { Tab, Tabs } from '@/components/hub-tabs'
import { useState } from 'react'
import { CodeSnippet } from '@/components/shared/code-snippet'
import { ProvenanceBadge } from '@/components/shared/status-badges'
import type { SetupStep } from '@/lib/schemas/manifest'

function StepList({ steps, emptyLabel, repoBlobBase }: { steps: SetupStep[]; emptyLabel: string; repoBlobBase: string | null }) {
  if (!steps.length) {
    return (
      <div className="rounded-xl border border-dashed bg-surface p-8 text-center" data-testid="awaiting-instructions">
        <p className="font-semibold">Awaiting verified repository instructions</p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{emptyLabel}</p>
      </div>
    )
  }
  const hasTemplate = steps.some((s) => s.provenance !== 'repository')
  return (
    <div className="flex flex-col gap-4">
      {hasTemplate && (
        <p role="note" className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100">
          Steps marked <strong>TEMPLATE</strong> are not yet verified against the repository. Check the repository README before running them.
        </p>
      )}
      <ol className="flex flex-col gap-5">
        {steps.map((step, i) => (
          <li key={`${step.title}-${i}`} className="flex gap-4">
            <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-semibold text-white">
              {i + 1}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-semibold">{step.title}</h4>
                <ProvenanceBadge provenance={step.provenance} />
                {step.sourcePath && repoBlobBase && (
                  <a href={`${repoBlobBase}/${step.sourcePath}`} target="_blank" rel="noreferrer" className="text-xs text-accent underline-offset-2 hover:underline">
                    Source: {step.sourcePath}
                  </a>
                )}
              </div>
              {step.description && <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>}
              {step.command && step.language !== 'none' && <CodeSnippet code={step.command} language={step.language} label={step.title} />}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function SetupTabs({
  local,
  atlas,
  supportsLocal,
  supportsAtlas,
  repoBlobBase,
}: {
  local: SetupStep[]
  atlas: SetupStep[]
  supportsLocal: boolean
  supportsAtlas: boolean
  repoBlobBase: string | null
}) {
  const [value, setValue] = useState(0)
  return (
    <Tabs aria-label="Setup modes" value={value} onValueChange={setValue}>
      <Tab name="Local Demo Mode">
        <div className="pt-6">
          {supportsLocal ? (
            <StepList steps={local} repoBlobBase={repoBlobBase} emptyLabel="No local-mode instructions have been sourced from the repository yet. Admins can sync the README or add catalog steps." />
          ) : (
            <p className="text-sm text-muted-foreground">This demo does not declare a Local Demo Mode.</p>
          )}
        </div>
      </Tab>
      <Tab name="Atlas Connected Mode">
        <div className="pt-6">
          {supportsAtlas ? (
            <StepList steps={atlas} repoBlobBase={repoBlobBase} emptyLabel="No Atlas-connected instructions have been sourced from the repository yet. Never paste Atlas credentials into shared docs; use local .env files." />
          ) : (
            <p className="text-sm text-muted-foreground">This demo does not declare an Atlas Connected Mode.</p>
          )}
        </div>
      </Tab>
    </Tabs>
  )
}
