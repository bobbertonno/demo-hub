import { describe, expect, it } from 'vitest'
import { normalizeRepositoryInput } from '@/lib/import/normalize'

describe('normalizeRepositoryInput', () => {
  it.each([
    'https://github.com/Owner/Repo',
    'https://github.com/owner/repo.git',
    'github.com/owner/repo/',
    'git@github.com:owner/repo.git',
    'owner/repo',
  ])('normalizes %s to one key', (input) => {
    expect(normalizeRepositoryInput(input).key).toBe('owner/repo')
  })

  it('keeps the branch from a tree URL', () => {
    expect(normalizeRepositoryInput('https://github.com/owner/repo/tree/develop').ref).toBe('develop')
  })

  it.each(['https://gitlab.com/owner/repo', 'not a url', 'https://github.com/owner', 'javascript:alert(1)'])('rejects %s', (input) => {
    expect(() => normalizeRepositoryInput(input)).toThrow()
  })
})
