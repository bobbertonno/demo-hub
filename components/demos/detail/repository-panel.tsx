'use client'

import { Option, Select } from '@leafygreen-ui/select'
import { useState } from 'react'
import { CodeSnippet } from '@/components/shared/code-snippet'

type Refs = { branches: string[]; tags: string[] }

export function RepositoryPanel({ slug, repository, defaultBranch }: { slug: string; repository: string | null; defaultBranch: string }) {
  const [refs, setRefs] = useState<Refs | null>(null)
  const [ref, setRef] = useState(defaultBranch)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!repository) {
    return (
      <div className="rounded-xl border border-dashed bg-surface p-6" data-testid="repo-missing">
        <p className="font-semibold">Repository not yet registered</p>
        <p className="mt-1 text-sm text-muted-foreground">This draft entry has no GitHub URL. An admin will add the real repository; the Hub never invents one.</p>
      </div>
    )
  }

  async function loadRefs() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/demos/${slug}/refs`)
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Unable to load branches and tags')
      setRefs(body)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load branches and tags')
    } finally {
      setLoading(false)
    }
  }

  const treeUrl = `${repository.replace(/\/$/, '')}/tree/${encodeURIComponent(ref)}`
  const cloneCmd = `git clone --branch ${ref} ${repository.replace(/\/$/, '')}.git`

  return (
    <div className="flex flex-col gap-4 rounded-xl border p-5">
      <a href={treeUrl} target="_blank" rel="noreferrer" className="break-all font-semibold text-accent hover:underline">
        {repository.replace('https://github.com/', '')}
      </a>
      {refs ? (
        <Select label="Branch or tag" value={ref} onChange={(v) => v && setRef(v)}>
          {[...new Set([defaultBranch, ...refs.branches])].map((b) => (
            <Option key={`b-${b}`} value={b}>{`branch: ${b}`}</Option>
          ))}
          {refs.tags.map((t) => (
            <Option key={`t-${t}`} value={t}>{`tag: ${t}`}</Option>
          ))}
        </Select>
      ) : (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span>
            Ref: <code>{ref}</code>
          </span>
          <button type="button" onClick={loadRefs} disabled={loading} className="rounded-md border px-3 py-1.5 hover:bg-surface disabled:opacity-50">
            {loading ? 'Loading…' : 'Choose branch/tag'}
          </button>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
      <CodeSnippet code={cloneCmd} language="bash" label="Clone repository" />
      <p className="text-xs text-muted-foreground">Clone command is derived from the registered URL and selected ref.</p>
    </div>
  )
}
