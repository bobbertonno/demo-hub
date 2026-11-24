'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { CheckCircle2, CircleAlert, Loader2, RefreshCw } from 'lucide-react'
import Badge from '@leafygreen-ui/badge'
import { Button } from '@/components/ui/button'
import { IMPORT_STAGES, STAGE_LABELS, type ImportJob } from '@/lib/import/types'
import type { CompatibilityReport } from '@/lib/compatibility/standard'

const fetcher = (url: string) => fetch(url).then((r) => r.json())
const LEVEL_LABEL: Record<string, string> = { basic: 'Basic', enhanced: 'Enhanced', 'fully-compatible': 'Fully compatible' }

export function EnrichmentPanel({ slug, compatibility, canSync }: { slug: string; compatibility: CompatibilityReport | null; canSync: boolean }) {
  const router = useRouter()
  const [queuing, setQueuing] = useState(false)
  const { data, mutate } = useSWR<{ job: ImportJob | null }>(`/api/demos/${slug}/enrichment`, fetcher, {
    refreshInterval: (latest) => (latest?.job && ['queued', 'running'].includes(latest.job.status) ? 2_000 : 0),
    onSuccess: (d, _k, cfg) => {
      if (d.job?.status === 'succeeded' && cfg) router.refresh()
    },
  })
  const job = data?.job ?? null
  const active = job && ['queued', 'running'].includes(job.status)

  async function sync() {
    setQueuing(true)
    try {
      await fetch(`/api/demos/${slug}/enrichment`, { method: 'POST' })
      await mutate()
    } finally {
      setQueuing(false)
    }
  }

  return (
    <section aria-labelledby="enrichment-heading" className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 id="enrichment-heading" className="text-lg font-semibold">
            Repository intelligence
          </h2>
          {compatibility && (
            <Badge variant={compatibility.level === 'fully-compatible' ? 'green' : compatibility.level === 'enhanced' ? 'blue' : 'lightgray'}>
              {`${LEVEL_LABEL[compatibility.level]} · ${compatibility.resources.filter((r) => r.status === 'found').length}/${compatibility.resources.length}`}
            </Badge>
          )}
        </div>
        {canSync && (
          <Button size="sm" variant="outline" onClick={sync} disabled={queuing || !!active} className="gap-2">
            <RefreshCw className={`size-4 ${active ? 'animate-spin' : ''}`} aria-hidden="true" />
            {job?.status === 'failed' ? 'Retry enrichment' : 'Sync repository'}
          </Button>
        )}
      </div>

      {job && (
        <ol className="grid gap-1.5 text-sm" aria-live="polite">
          {IMPORT_STAGES.map((stage) => {
            const result = job.stages.find((s) => s.stage === stage)
            const running = job.stage === stage && active
            return (
              <li key={stage} className="flex items-center gap-2" title={result?.detail}>
                {running ? (
                  <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
                ) : result?.status === 'ok' ? (
                  <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                ) : result?.status === 'failed' ? (
                  <CircleAlert className="size-4 text-destructive" aria-hidden="true" />
                ) : (
                  <span className="size-4 rounded-full border" aria-hidden="true" />
                )}
                <span className={result || running ? '' : 'text-muted-foreground'}>{STAGE_LABELS[stage]}</span>
              </li>
            )
          })}
        </ol>
      )}
      {job?.error && <p className="text-sm text-muted-foreground">{job.status === 'failed' ? `Enrichment failed: ${job.error}` : job.error}</p>}

      {compatibility && (
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-1 text-sm">
            {compatibility.resources.map((c) => (
              <li key={c.kind} className="flex items-start gap-2">
                {c.status === 'found' ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                <span>
                  <span className="sr-only">{c.status === 'found' ? 'Found: ' : c.status === 'invalid' ? 'Invalid: ' : 'Missing: '}</span>
                  {c.kind}
                  {c.path && <code className="ml-1 text-xs text-muted-foreground">{c.path}</code>}
                  {c.detail && <span className="block text-xs text-muted-foreground">{c.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
          {compatibility.recommendations.length > 0 && (
            <div className="flex flex-col gap-2 text-sm">
              <p className="font-medium">Recommendations</p>
              <ul className="list-disc pl-5 text-muted-foreground">
                {compatibility.recommendations.slice(0, 6).map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
