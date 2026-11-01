'use client'

import Code from '@leafygreen-ui/code'
import { useHubTheme } from '@/components/providers'

type Lang = 'bash' | 'shell' | 'yaml' | 'json' | 'javascript' | 'typescript' | 'python' | 'none'

const map: Record<Lang, string> = {
  bash: 'bash',
  shell: 'shell',
  yaml: 'yaml',
  json: 'json',
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  none: 'none',
}

/** LeafyGreen Code block with syntax highlighting and a persistent copy button. */
export function CodeSnippet({ code, language = 'bash', label }: { code: string; language?: Lang; label?: string }) {
  const { darkMode } = useHubTheme()
  return (
    <div data-testid="code-snippet" aria-label={label}>
      <Code language={map[language] as 'bash'} copyButtonAppearance="persist" darkMode={darkMode}>
        {code}
      </Code>
    </div>
  )
}
