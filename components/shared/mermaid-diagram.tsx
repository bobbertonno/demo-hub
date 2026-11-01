'use client'

import { useEffect, useId, useState } from 'react'
import { useHubTheme } from '@/components/providers'

type State = { status: 'loading' } | { status: 'ok'; svg: string } | { status: 'error'; message: string }

/** Renders Mermaid source client-side with `securityLevel: strict` (no click handlers or raw HTML). */
export function MermaidDiagram({ source, title, className }: { source: string; title: string; className?: string }) {
  const { darkMode } = useHubTheme()
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, '')
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          fontFamily: 'Inter, Helvetica, Arial, sans-serif',
          themeVariables: darkMode
            ? { primaryColor: '#023430', primaryTextColor: '#E8EDEB', primaryBorderColor: '#00ED64', lineColor: '#71F6BA', secondaryColor: '#112733', tertiaryColor: '#1C2D38', background: '#001E2B', clusterBkg: '#112733', clusterBorder: '#3D4F58' }
            : { primaryColor: '#E3FCF7', primaryTextColor: '#001E2B', primaryBorderColor: '#00684A', lineColor: '#00684A', secondaryColor: '#F9FBFA', tertiaryColor: '#FFFFFF', background: '#FFFFFF', clusterBkg: '#F9FBFA', clusterBorder: '#C1C7C6' },
        })
        await mermaid.parse(source)
        const { svg } = await mermaid.render(`mmd-${reactId}-${darkMode ? 'd' : 'l'}`, source)
        if (!cancelled) setState({ status: 'ok', svg })
      } catch (err) {
        if (!cancelled) setState({ status: 'error', message: err instanceof Error ? err.message : 'Invalid diagram' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [source, darkMode, reactId])

  if (state.status === 'loading') {
    return <div className={`flex min-h-48 items-center justify-center rounded-lg bg-surface text-sm text-muted-foreground ${className ?? ''}`}>Rendering diagram…</div>
  }
  if (state.status === 'error') {
    return (
      <div role="alert" className={`rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200 ${className ?? ''}`}>
        <p className="font-semibold">Diagram could not be rendered</p>
        <p className="mt-1 font-mono text-xs">{state.message.slice(0, 300)}</p>
      </div>
    )
  }
  return (
    <figure className={className} data-testid="mermaid-diagram">
      {/* Mermaid output is generated locally with securityLevel=strict, which sanitizes labels. */}
      <div role="img" aria-label={title} className="mermaid-host flex justify-center" dangerouslySetInnerHTML={{ __html: state.svg }} />
    </figure>
  )
}
