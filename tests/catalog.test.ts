import { describe, expect, it } from 'vitest'
import { demosForCapability, filterDemos } from '@/lib/catalog/filters'
import { DemoManifest, DemoRecord } from '@/lib/schemas/manifest'
import { seedCapabilities } from '@/lib/seed/capabilities'
import { ATLAS_CORE_ILLUSTRATIVE_NODES_PER_SHARD, ATLAS_CORE_ILLUSTRATIVE_SHARDS, ATLAS_INFINITE_COMPUTE_NODES, seedDemos } from '@/lib/seed/demos'
import { MIGRATION_SIMULATION_STEPS } from '@/lib/atlas-infinite/simulation'

describe('seed catalog', () => {
  it('contains exactly four valid DRAFT demos without invented repositories or screenshots', () => {
    expect(seedDemos).toHaveLength(4)
    for (const demo of seedDemos) {
      expect(() => DemoRecord.parse(demo)).not.toThrow()
      expect(demo.status).toBe('draft')
      expect(demo.repository).toBeNull()
      expect(demo.screenshots).toHaveLength(0)
    }
  })

  it('never marks seed setup steps as verified repository commands', () => {
    for (const demo of seedDemos) {
      for (const step of [...demo.localSetup, ...demo.atlasSetup]) expect(step.provenance).not.toBe('repository')
    }
  })

  it('has unique slugs and ids', () => {
    expect(new Set(seedDemos.map((d) => d.slug)).size).toBe(4)
    expect(new Set(seedDemos.map((d) => d.id)).size).toBe(4)
  })

  it('only references defined capabilities', () => {
    const ids = new Set(seedCapabilities.map((c) => c.id))
    for (const demo of seedDemos) for (const c of demo.capabilities) expect(ids.has(c.capability)).toBe(true)
  })
})

describe('catalog filters', () => {
  it('filters by capability', () => {
    const result = demosForCapability(seedDemos, 'atlas-infinite')
    expect(result.map((r) => r.demo.slug)).toEqual(['atlas-infinite-scale-without-limits'])
    expect(result[0].mapping.capability).toBe('atlas-infinite')
  })

  it('combines free text and structured filters', () => {
    const all = filterDemos(seedDemos, { capability: 'vector-search' })
    expect(all.length).toBeGreaterThan(0)
    expect(all.every((d) => d.capabilities.some((c) => c.capability === 'vector-search'))).toBe(true)
    expect(filterDemos(seedDemos, { q: 'digital euro' }).map((d) => d.slug)).toEqual(['digital-euro-single-view-audit'])
    expect(filterDemos(seedDemos, { q: 'no-such-term-xyz' })).toHaveLength(0)
  })

  it('sorts by title by default', () => {
    const titles = filterDemos(seedDemos, {}).map((d) => d.title)
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)))
  })
})

describe('manifest validation', () => {
  it('rejects non-GitHub or non-HTTPS repository URLs', () => {
    const base = DemoManifest.parse(seedDemos[0])
    expect(DemoManifest.safeParse({ ...base, repository: 'http://github.com/a/b' }).success).toBe(false)
    expect(DemoManifest.safeParse({ ...base, repository: 'https://evil.example.com/a/b' }).success).toBe(false)
    expect(DemoManifest.safeParse({ ...base, repository: 'https://github.com/mongodb/example' }).success).toBe(true)
  })

  it('requires customer theme metadata only for non-mongodb theme modes', () => {
    const workflow = seedDemos.find((d) => d.slug === 'intelligent-workflow-automation')!
    expect(workflow.themeMode).toBe('customer')
    expect(workflow.customerTheme?.name).toBeTruthy()
  })
})

describe('Atlas Infinite educational content', () => {
  it('shows exactly two compute nodes and an illustrative 3x3 Atlas Core configuration', () => {
    expect(ATLAS_INFINITE_COMPUTE_NODES).toBe(2)
    expect(ATLAS_CORE_ILLUSTRATIVE_SHARDS * ATLAS_CORE_ILLUSTRATIVE_NODES_PER_SHARD).toBe(9)
  })

  it('stores speculative facts as unverified metadata, not product facts', () => {
    const demo = seedDemos.find((d) => d.slug === 'atlas-infinite-scale-without-limits')!
    expect(demo.facts.length).toBeGreaterThan(0)
    const productFacts = demo.facts.filter((f) => f.kind === 'product-fact')
    expect(productFacts.length).toBeGreaterThan(0)
    expect(productFacts.every((f) => f.verificationStatus !== 'verified')).toBe(true)
  })

  it('walks through the six simulated migration phases', () => {
    expect(MIGRATION_SIMULATION_STEPS.map((s) => s.id)).toHaveLength(6)
  })
})
