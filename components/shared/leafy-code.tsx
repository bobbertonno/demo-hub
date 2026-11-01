'use client'

import Code from '@leafygreen-ui/code'

export default function LeafyCode({ code, language, darkMode }: { code: string; language: string; darkMode: boolean }) {
  return (
    <Code language={language as 'bash'} copyButtonAppearance="persist" darkMode={darkMode}>
      {code}
    </Code>
  )
}
