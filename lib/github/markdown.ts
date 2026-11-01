import { Marked, type Tokens } from 'marked'
import sanitizeHtml from 'sanitize-html'
import type { SetupStep } from '@/lib/schemas/manifest'
import type { ExtractedSetup, RepoRef } from './types'

const ALLOWED_IMAGE_HOSTS = new Set(['raw.githubusercontent.com', 'github.com', 'user-images.githubusercontent.com', 'private-user-images.githubusercontent.com', 'avatars.githubusercontent.com'])

export function resolveRepoUrl(href: string, repo: RepoRef, ref: string, kind: 'link' | 'image'): string | null {
  if (!href) return null
  if (href.startsWith('#')) return href
  try {
    const abs = new URL(href)
    if (kind === 'image') return abs.protocol === 'https:' && ALLOWED_IMAGE_HOSTS.has(abs.hostname) ? abs.toString() : null
    return abs.protocol === 'https:' || abs.protocol === 'mailto:' ? abs.toString() : null
  } catch {
    const clean = href.replace(/^\.\//, '').replace(/^\//, '')
    if (clean.split('/').some((s) => s === '..')) return null
    const encoded = clean.split('/').map((s) => encodeURIComponent(decodeURIComponent(s.split('#')[0]))).join('/')
    return kind === 'image'
      ? `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${encodeURIComponent(ref)}/${encoded}`
      : `https://github.com/${repo.owner}/${repo.repo}/blob/${encodeURIComponent(ref)}/${encoded}`
  }
}

/** Renders untrusted README Markdown to sanitized HTML. Raw HTML is stripped to a safe allowlist. */
export function renderRepositoryMarkdown(markdown: string, repo: RepoRef, ref: string): string {
  const marked = new Marked({ gfm: true, async: false })
  marked.use({
    walkTokens(token) {
      if (token.type === 'link') {
        const t = token as Tokens.Link
        t.href = resolveRepoUrl(t.href, repo, ref, 'link') ?? '#'
      }
      if (token.type === 'image') {
        const t = token as Tokens.Image
        t.href = resolveRepoUrl(t.href, repo, ref, 'image') ?? ''
      }
    },
  })
  const html = marked.parse(markdown.slice(0, 500_000)) as string
  return sanitizeMarkdownHtml(html)
}

export function sanitizeMarkdownHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li', 'strong', 'em', 'del', 'code', 'pre', 'blockquote', 'hr', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'details', 'summary', 'input', 'sup', 'sub', 'kbd'],
    allowedAttributes: {
      a: ['href', 'title'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      code: ['class'],
      th: ['align'],
      td: ['align'],
      input: ['type', 'checked', 'disabled'],
    },
    allowedSchemes: ['https', 'mailto'],
    allowedSchemesByTag: { img: ['https'] },
    allowedClasses: { code: [/^language-[a-z0-9+-]+$/] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: attribs.href?.startsWith('#') ? attribs : { ...attribs, target: '_blank', rel: 'noopener noreferrer nofollow' },
      }),
      img: (tagName, attribs) => {
        try {
          const u = new URL(attribs.src ?? '')
          if (!ALLOWED_IMAGE_HOSTS.has(u.hostname)) return { tagName: 'span', attribs: {} }
        } catch {
          return { tagName: 'span', attribs: {} }
        }
        return { tagName, attribs: { ...attribs, loading: 'lazy', referrerpolicy: 'no-referrer' } }
      },
      input: (tagName, attribs) => (attribs.type === 'checkbox' ? { tagName, attribs: { ...attribs, disabled: '' } } : { tagName: 'span', attribs: {} }),
    },
  })
}

const LOCAL_HEADING = /\b(local|demo mode|quick ?start|getting started|run(ning)? (it )?locally|installation|install|docker)\b/i
const ATLAS_HEADING = /\batlas\b/i
const LANG_MAP: Record<string, SetupStep['language']> = { bash: 'bash', sh: 'bash', shell: 'shell', zsh: 'bash', console: 'shell', yaml: 'yaml', yml: 'yaml', json: 'json', js: 'javascript', javascript: 'javascript', ts: 'typescript', typescript: 'typescript', python: 'python', py: 'python' }

/**
 * Extracts copyable setup commands from README sections. Steps are marked
 * provenance="repository" because they are quoted verbatim from the repository.
 */
export function extractSetupFromReadme(markdown: string, readmePath: string): ExtractedSetup {
  const tokens = new Marked({ gfm: true }).lexer(markdown)
  const result: ExtractedSetup = { local: [], atlas: [] }
  let section: 'local' | 'atlas' | null = null
  let sectionDepth = 0
  let heading = ''
  let lastText = ''
  for (const token of tokens) {
    if (token.type === 'heading') {
      const h = token as Tokens.Heading
      if (section && h.depth <= sectionDepth) section = null
      if (ATLAS_HEADING.test(h.text)) {
        section = 'atlas'
        sectionDepth = h.depth
      } else if (LOCAL_HEADING.test(h.text) && (!section || h.depth <= sectionDepth)) {
        section = 'local'
        sectionDepth = h.depth
      }
      heading = h.text
      lastText = ''
      continue
    }
    if (!section) continue
    if (token.type === 'paragraph') lastText = (token as Tokens.Paragraph).text.slice(0, 600)
    if (token.type === 'code') {
      const c = token as Tokens.Code
      const lang = LANG_MAP[(c.lang ?? '').toLowerCase()] ?? 'bash'
      result[section].push({
        title: heading.slice(0, 160) || 'Step',
        description: lastText || undefined,
        command: c.text.slice(0, 4000),
        language: lang,
        provenance: 'repository',
        sourcePath: readmePath,
      })
      lastText = ''
    }
  }
  return result
}
