'use client'

import dynamic from 'next/dynamic'
import { useSyncExternalStore } from 'react'
import { useHubTheme } from '@/components/providers'

type Lang = 'bash' | 'shell' | 'yaml' | 'json' | 'javascript' | 'typescript' | 'python' | 'none'

// LeafyGreen Code accesses `document` during render, which breaks static prerendering.
const LeafyCode = dynamic(() => import('./leafy-code'), { ssr: false, loading: () => null })

const subscribe = () => () => {}

function PlainCode({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-md border bg-muted px-4 py-3 font-mono text-[13px] leading-relaxed">
      <code>{code}</code>
    </pre>
  )
}

/** LeafyGreen Code block with syntax highlighting and a persistent copy button. */
export function CodeSnippet({ code, language = 'bash', label }: { code: string; language?: Lang; label?: string }) {
  const { darkMode } = useHubTheme()
  const isClient = useSyncExternalStore(subscribe, () => true, () => false)
  return (
    <div data-testid="code-snippet" aria-label={label}>
      {isClient ? <LeafyCode code={code} language={language} darkMode={darkMode} /> : <PlainCode code={code} />}
    </div>
  )
}
