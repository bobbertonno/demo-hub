import { describe, expect, it } from 'vitest'
import { hasRole, isAllowedCorporateIdentity } from '@/lib/auth/roles'
import { assertSafePath, assertSafeRef, parseRepoUrl } from '@/lib/github/client'
import { renderRepositoryMarkdown, resolveRepoUrl, sanitizeMarkdownHtml } from '@/lib/github/markdown'
import { signGithubPayload, verifyGithubSignature } from '@/lib/github/webhook'

const repo = parseRepoUrl('https://github.com/acme/demo')

describe('roles', () => {
  it('orders viewer < contributor < admin', () => {
    expect(hasRole('viewer', 'contributor')).toBe(false)
    expect(hasRole('contributor', 'contributor')).toBe(true)
    expect(hasRole('admin', 'contributor')).toBe(true)
    expect(hasRole(null, 'viewer')).toBe(false)
  })
})

describe('corporate identity', () => {
  const domains = ['mongodb.com']
  it('requires a verified email', () => {
    expect(isAllowedCorporateIdentity({ email: 'a@mongodb.com', email_verified: true }, domains)).toBe(true)
    expect(isAllowedCorporateIdentity({ email: 'a@mongodb.com', email_verified: false }, domains)).toBe(false)
    expect(isAllowedCorporateIdentity({ email: 'a@mongodb.com' }, domains)).toBe(false)
    expect(isAllowedCorporateIdentity({ email: 'a@mongodb.com', email_verified: 'true' }, domains)).toBe(false)
  })
  it('rejects look-alike domains', () => {
    expect(isAllowedCorporateIdentity({ email: 'a@evilmongodb.com', email_verified: true }, domains)).toBe(false)
    expect(isAllowedCorporateIdentity({ email: 'a@mongodb.com.evil.io', email_verified: true }, domains)).toBe(false)
    expect(isAllowedCorporateIdentity({ email: 'a@b@mongodb.com', email_verified: true }, domains)).toBe(false)
  })
})

describe('GitHub webhook signature', () => {
  it('accepts valid and rejects tampered payloads', () => {
    const body = '{"ref":"refs/heads/main"}'
    const sig = signGithubPayload(body, 'secret')
    expect(verifyGithubSignature(body, sig, 'secret')).toBe(true)
    expect(verifyGithubSignature(body + ' ', sig, 'secret')).toBe(false)
    expect(verifyGithubSignature(body, sig, 'other')).toBe(false)
    expect(verifyGithubSignature(body, null, 'secret')).toBe(false)
    expect(verifyGithubSignature(body, sig, undefined)).toBe(false)
  })
})

describe('repository path safety', () => {
  it('rejects traversal and malformed refs', () => {
    expect(() => assertSafePath('../etc/passwd')).toThrow()
    expect(() => assertSafeRef('main;rm -rf')).toThrow()
    expect(assertSafePath('docs/architecture.md')).toBe('docs/architecture.md')
  })
  it('only parses github.com repositories', () => {
    expect(() => parseRepoUrl('https://gitlab.com/a/b')).toThrow()
  })
})

describe('markdown sanitization', () => {
  it('strips scripts, event handlers and javascript: links', () => {
    const html = sanitizeMarkdownHtml('<p onclick="x()">hi</p><script>alert(1)</script><a href="javascript:alert(1)">x</a><iframe src="https://x"></iframe>')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('onclick')
    expect(html).not.toContain('javascript:')
    expect(html).not.toContain('<iframe')
  })
  it('rewrites relative images to the raw repository and blocks foreign image hosts', () => {
    expect(resolveRepoUrl('docs/a.png', repo, 'main', 'image')).toContain('raw.githubusercontent.com/acme/demo/main/docs/a.png')
    expect(resolveRepoUrl('http://169.254.169.254/latest', repo, 'main', 'image')).toBeNull()
  })
  it('renders fenced code blocks', () => {
    const html = renderRepositoryMarkdown('# Title\n\n```bash\nnpm install\n```', repo, 'main')
    expect(html).toContain('<h1')
    expect(html).toContain('npm install')
  })
})
