const LABELS: Record<string, string> = {
  atlas: 'MongoDB Atlas',
  crud: 'CRUD & Document Model',
  aggregation: 'Aggregation Pipeline',
  'atlas-search': 'Atlas Search',
  'vector-search': 'Atlas Vector Search',
  'voyage-ai': 'Voyage AI Embeddings',
  'change-streams': 'Change Streams',
  'stream-processing': 'Atlas Stream Processing',
  kafka: 'Kafka Integration',
  'online-archive': 'Online Archive',
  sharding: 'Sharding',
  'atlas-infinite': 'Atlas Infinite',
}

export function capabilityLabel(id: string): string {
  return LABELS[id] ?? id
}

export const MATURITY_LABELS: Record<string, string> = { concept: 'Concept', prototype: 'Prototype', beta: 'Beta', stable: 'Stable', deprecated: 'Deprecated' }
export const RUNTIME_LABELS: Record<string, string> = {
  'local-demo': 'Local Demo Mode',
  'atlas-connected': 'Atlas Connected Mode',
  hybrid: 'Hybrid',
  'interactive-educational': 'Interactive educational',
}
export const DIFFICULTY_LABELS: Record<string, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }
export const STATUS_LABELS: Record<string, string> = { draft: 'Draft', in_review: 'In review', published: 'Published', archived: 'Archived' }
