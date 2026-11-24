import 'server-only'
import type { Collection, Db, Document } from 'mongodb'
import { COLLECTIONS, getCollection } from '@/lib/db/mongo'
import { embedText, embeddingsConfig } from './embeddings'

export const SEARCH_INDEX = 'demo_catalog_search'
export const VECTOR_INDEX = 'demo_catalog_vector'

const token = { type: 'token' }
const text = { type: 'string', analyzer: 'lucene.standard' }

export const SEARCH_DEFINITION = {
  mappings: {
    dynamic: false,
    fields: {
      title: [text, { type: 'autocomplete', tokenization: 'edgeGram', minGrams: 2, maxGrams: 15, foldDiacritics: true }],
      summary: text,
      tagline: text,
      useCases: text,
      tags: [text, token],
      category: [text, token],
      industry: token,
      status: token,
      capabilities: { type: 'document', fields: { capability: token } },
      hub: { type: 'document', fields: { compatibility: { type: 'document', fields: { level: token } }, searchText: { type: 'document', fields: { readme: text, architecture: text } } } },
    },
  },
}

function vectorDefinition(dimensions: number) {
  return { fields: [{ type: 'vector', path: 'hub.embedding', numDimensions: dimensions, similarity: 'cosine' }, { type: 'filter', path: 'status' }] }
}

/** Idempotent: creates missing indexes and updates changed definitions. */
export async function ensureSearchIndexes(db: Db, log: (m: string) => void = () => {}): Promise<void> {
  if (!(await db.listCollections({ name: COLLECTIONS.demos }).hasNext())) await db.createCollection(COLLECTIONS.demos)
  const col = db.collection(COLLECTIONS.demos)
  const existing = (await col.listSearchIndexes().toArray()) as { name: string; latestDefinition?: unknown }[]
  const wanted: { name: string; type: 'search' | 'vectorSearch'; definition: Document }[] = [{ name: SEARCH_INDEX, type: 'search', definition: SEARCH_DEFINITION }]
  const cfg = embeddingsConfig()
  if (cfg.provider !== 'none') wanted.push({ name: VECTOR_INDEX, type: 'vectorSearch', definition: vectorDefinition(cfg.dimensions) })
  for (const w of wanted) {
    const found = existing.find((e) => e.name === w.name)
    if (!found) {
      await col.createSearchIndex({ name: w.name, type: w.type, definition: w.definition })
      log(`created search index ${w.name}`)
    } else if (JSON.stringify(found.latestDefinition) !== JSON.stringify(w.definition)) {
      await col.updateSearchIndex(w.name, w.definition)
      log(`updated search index ${w.name}`)
    }
  }
}

export type SearchAvailability = { available: true } | { available: false; reason: string }
let availabilityCache: { at: number; value: SearchAvailability } | null = null

export async function searchAvailability(col?: Collection<Document>): Promise<SearchAvailability> {
  if (availabilityCache && Date.now() - availabilityCache.at < 30_000) return availabilityCache.value
  let value: SearchAvailability
  try {
    const c = col ?? (await getCollection<Document>(COLLECTIONS.demos))
    const idx = (await c.listSearchIndexes(SEARCH_INDEX).toArray()) as { status?: string; queryable?: boolean }[]
    value = !idx.length ? { available: false, reason: 'Search index has not been created yet' } : idx[0].queryable === false ? { available: false, reason: `Search index is ${idx[0].status ?? 'building'}` } : { available: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    value = { available: false, reason: /not enabled|mongot|31082|search/i.test(msg) ? 'MongoDB Search (mongot) is not running for this database' : 'Search unavailable' }
  }
  availabilityCache = { at: Date.now(), value }
  return value
}

export type SearchFilters = { q: string; category?: string; capability?: string; compatibility?: string; statuses: string[] }
export type SearchHit = { slug: string; title: string; score: number; highlight: string | null }

function compound(f: SearchFilters) {
  const filter: Document[] = [{ in: { path: 'status', value: f.statuses } }]
  if (f.category) filter.push({ in: { path: 'category', value: [f.category] } })
  if (f.capability) filter.push({ in: { path: 'capabilities.capability', value: [f.capability] } })
  if (f.compatibility) filter.push({ in: { path: 'hub.compatibility.level', value: [f.compatibility] } })
  return {
    must: [{ text: { query: f.q, path: ['title', 'summary', 'tagline', 'tags', 'useCases', 'category', 'hub.searchText.readme', 'hub.searchText.architecture'], fuzzy: { maxEdits: 1, prefixLength: 2 } } }],
    should: [{ text: { query: f.q, path: 'title', score: { boost: { value: 5 } } } }, { autocomplete: { query: f.q, path: 'title' } }],
    filter,
  }
}

export async function searchCatalog(f: SearchFilters): Promise<
  { available: true; hits: SearchHit[]; facets: Record<string, { value: string; count: number }[]>; semantic: boolean } | { available: false; reason: string }
> {
  const col = await getCollection<Document>(COLLECTIONS.demos)
  const availability = await searchAvailability(col)
  if (!availability.available) return availability

  const [docs, meta] = await Promise.all([
    col
      .aggregate([
        { $search: { index: SEARCH_INDEX, compound: compound(f), highlight: { path: ['summary', 'hub.searchText.readme'] } } },
        { $limit: 50 },
        { $project: { _id: 0, slug: 1, title: 1, score: { $meta: 'searchScore' }, highlights: { $meta: 'searchHighlights' } } },
      ])
      .toArray(),
    col
      .aggregate([
        {
          $searchMeta: {
            index: SEARCH_INDEX,
            facet: {
              operator: { compound: compound(f) },
              facets: { category: { type: 'string', path: 'category' }, capability: { type: 'string', path: 'capabilities.capability' }, compatibility: { type: 'string', path: 'hub.compatibility.level' } },
            },
          },
        },
      ])
      .toArray(),
  ])

  const hits: SearchHit[] = docs.map((d) => {
    const h = (d.highlights as { texts: { value: string; type: string }[] }[] | undefined)?.[0]
    return { slug: d.slug, title: d.title, score: d.score, highlight: h ? h.texts.map((t) => t.value).join('').slice(0, 240) : null }
  })

  let semantic = false
  if (embeddingsConfig().provider !== 'none') {
    try {
      const vector = await embedText(f.q)
      if (vector) {
        const near = await col
          .aggregate([{ $vectorSearch: { index: VECTOR_INDEX, path: 'hub.embedding', queryVector: vector, numCandidates: 100, limit: 10, filter: { status: { $in: f.statuses } } } }, { $project: { _id: 0, slug: 1, title: 1, score: { $meta: 'vectorSearchScore' } } }])
          .toArray()
        for (const n of near) if (!hits.some((h) => h.slug === n.slug)) hits.push({ slug: n.slug, title: n.title, score: n.score, highlight: null })
        semantic = true
      }
    } catch {
      semantic = false
    }
  }

  const buckets = (meta[0]?.facet ?? {}) as Record<string, { buckets: { _id: string; count: number }[] }>
  const facets = Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.buckets.map((b) => ({ value: b._id, count: b.count }))]))
  return { available: true, hits, facets, semantic }
}

export async function autocompleteTitles(q: string, statuses: string[]): Promise<{ slug: string; title: string }[]> {
  const col = await getCollection<Document>(COLLECTIONS.demos)
  if (!(await searchAvailability(col)).available) return []
  return (await col
    .aggregate([{ $search: { index: SEARCH_INDEX, compound: { must: [{ autocomplete: { query: q, path: 'title' } }], filter: [{ in: { path: 'status', value: statuses } }] } } }, { $limit: 8 }, { $project: { _id: 0, slug: 1, title: 1 } }])
    .toArray()) as { slug: string; title: string }[]
}

/** Total documents in the search index; used by health checks and smoke tests. */
export async function indexedDocumentCount(): Promise<number | null> {
  const col = await getCollection<Document>(COLLECTIONS.demos)
  if (!(await searchAvailability(col)).available) return null
  const res = await col.aggregate([{ $searchMeta: { index: SEARCH_INDEX, exists: { path: 'title' }, count: { type: 'total' } } }]).toArray()
  return (res[0]?.count?.total as number | undefined) ?? 0
}
