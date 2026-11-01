'use client'

import Badge from '@leafygreen-ui/badge'
import { Button } from '@/components/lg'
import Callout from '@leafygreen-ui/callout'
import { useState } from 'react'
import { MIGRATION_SIMULATION_STEPS } from '@/lib/atlas-infinite/simulation'

/**
 * Pure client-side walkthrough. It performs no network requests and has no
 * access to infrastructure; "real migration" is intentionally not offered.
 */
export function MigrationSimulator() {
  const [current, setCurrent] = useState(-1)
  const done = current >= MIGRATION_SIMULATION_STEPS.length - 1

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="blue">SIMULATION</Badge>
        <p className="text-sm text-muted-foreground">No infrastructure is contacted or modified. This walkthrough runs entirely in your browser.</p>
      </div>

      <ol className="grid gap-3 md:grid-cols-3" data-testid="migration-steps">
        {MIGRATION_SIMULATION_STEPS.map((s, i) => {
          const state = i < current ? 'complete' : i === current ? 'active' : 'pending'
          return (
            <li
              key={s.id}
              aria-current={state === 'active' ? 'step' : undefined}
              data-state={state}
              className={`rounded-xl border p-4 transition-colors ${state === 'active' ? 'border-leaf bg-leaf/10' : state === 'complete' ? 'border-leaf-dark/50' : ''}`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Step {i + 1} · {state}
              </p>
              <p className="mt-1 font-semibold">{s.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
            </li>
          )
        })}
      </ol>

      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => setCurrent((c) => Math.min(c + 1, MIGRATION_SIMULATION_STEPS.length - 1))} disabled={done} data-testid="simulate-next">
          {current < 0 ? 'Start simulation' : done ? 'Simulation complete' : 'Next simulated step'}
        </Button>
        <Button onClick={() => setCurrent(-1)} disabled={current < 0}>
          Reset
        </Button>
      </div>

      <Callout variant="warning" title="Real migration is not available from the Hub">
        Actual migrations require a separately validated implementation, appropriate Atlas permissions and an approved change process. Follow official MongoDB procedures —{' '}
        <a className="underline" href="https://www.mongodb.com/docs/atlas/" target="_blank" rel="noreferrer">
          Atlas documentation
        </a>{' '}
        and{' '}
        <a className="underline" href="https://www.mongodb.com/docs/atlas/import/" target="_blank" rel="noreferrer">
          Atlas migration guidance
        </a>
        .
      </Callout>
    </div>
  )
}
