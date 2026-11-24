'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Modal from '@leafygreen-ui/modal'
import TextInput from '@leafygreen-ui/text-input'
import { FolderGit2 as Github, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ImportRepositoryDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<{ message: string; slug?: string | null } | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      const res = await fetch('/api/import', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError({ message: data.error ?? 'Import failed', slug: data.slug })
        return
      }
      setOpen(false)
      setUrl('')
      router.push(`/demos/${data.demo.slug}`)
    } catch {
      setError({ message: 'Network error. Try again.' })
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <Button size="sm" className="gap-2" onClick={() => setOpen(true)} data-testid="import-open">
        <Github className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Import</span>
        <span className="sr-only sm:hidden">Import from GitHub</span>
      </Button>
      <Modal open={open} setOpen={setOpen} size="default">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">Import a repository</h2>
            <p className="text-sm text-muted-foreground">
              {'Paste a GitHub URL. The demo appears right away and is enriched in the background: README, architecture, screenshots, MongoDB capabilities and a compatibility score.'}
            </p>
          </div>
          <TextInput
            label="Repository URL"
            description="Accepts https URLs, owner/repo, SSH remotes and /tree/<branch> links."
            placeholder="https://github.com/owner/repo"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={pending}
            required
            data-testid="import-url"
          />
          <Link href="/compatibility" className="text-sm underline underline-offset-2" onClick={() => setOpen(false)}>
            How to prepare a repository for the Demo Hub
          </Link>
          {error && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error.message}{' '}
              {error.slug && (
                <Link href={`/demos/${error.slug}`} className="font-medium underline underline-offset-2" onClick={() => setOpen(false)}>
                  Open existing demo
                </Link>
              )}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !url.trim()} className="gap-2" data-testid="import-submit">
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {pending ? 'Importing' : 'Import'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
