const SEGMENT = /^[A-Za-z0-9_.-]{1,100}$/

export type NormalizedRepository = { owner: string; repo: string; ref: string | null; key: string; url: string }

/** Accepts https URLs, bare github.com paths, owner/repo shorthand, and SSH remotes. */
export function normalizeRepositoryInput(input: string): NormalizedRepository {
  let value = input.trim()
  if (!value) throw new Error('Enter a GitHub repository URL')
  const ssh = value.match(/^git@github\.com:(.+)$/i)
  if (ssh) value = `https://github.com/${ssh[1]}`
  else if (/^github\.com\//i.test(value)) value = `https://${value}`
  else if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value)) value = `https://github.com/${value}`

  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('Not a valid GitHub repository URL')
  }
  if (!['https:', 'http:'].includes(url.protocol) || !['github.com', 'www.github.com'].includes(url.hostname.toLowerCase())) {
    throw new Error('Only github.com repositories are supported')
  }
  const parts = url.pathname.split('/').filter(Boolean)
  const owner = parts[0]
  const repo = (parts[1] ?? '').replace(/\.git$/i, '')
  if (!owner || !repo || !SEGMENT.test(owner) || !SEGMENT.test(repo)) throw new Error('URL must point to a repository, like https://github.com/owner/repo')
  const ref = parts[2] === 'tree' && parts[3] ? decodeURIComponent(parts.slice(3).join('/')) : null
  if (ref && (!/^[A-Za-z0-9_./-]{1,120}$/.test(ref) || ref.includes('..'))) throw new Error('Unsupported branch name in URL')
  return { owner, repo, ref, key: `${owner}/${repo}`.toLowerCase(), url: `https://github.com/${owner}/${repo}` }
}

export function slugFromRepo(repo: string): string {
  return (
    repo
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70) || 'demo'
  )
}

export function humanizeRepoName(repo: string): string {
  return repo
    .replace(/[-_.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .slice(0, 120)
}
