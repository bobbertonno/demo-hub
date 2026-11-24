export type EmbeddingsConfig = { provider: 'none' | 'ollama' | 'voyage'; model: string; dimensions: number }

export function embeddingsConfig(): EmbeddingsConfig {
  const provider = (process.env.EMBEDDINGS_PROVIDER ?? 'none') as EmbeddingsConfig['provider']
  if (provider === 'voyage' && process.env.VOYAGE_API_KEY) return { provider, model: process.env.EMBEDDINGS_MODEL ?? 'voyage-3.5-lite', dimensions: Number(process.env.EMBEDDINGS_DIMENSIONS ?? 1024) }
  if (provider === 'ollama') return { provider, model: process.env.EMBEDDINGS_MODEL ?? 'nomic-embed-text', dimensions: Number(process.env.EMBEDDINGS_DIMENSIONS ?? 768) }
  return { provider: 'none', model: '', dimensions: 0 }
}

/** Returns null when no provider is configured; semantic search is then reported as unavailable. */
export async function embedText(text: string): Promise<number[] | null> {
  const cfg = embeddingsConfig()
  if (cfg.provider === 'none' || !text.trim()) return null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)
  try {
    if (cfg.provider === 'voyage') {
      const res = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.VOYAGE_API_KEY}` },
        body: JSON.stringify({ input: [text.slice(0, 16_000)], model: cfg.model, output_dimension: cfg.dimensions }),
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`Voyage AI embeddings failed (${res.status})`)
      return ((await res.json()) as { data: { embedding: number[] }[] }).data[0].embedding
    }
    const base = (process.env.OLLAMA_URL ?? 'http://ollama:11434').replace(/\/$/, '')
    const res = await fetch(`${base}/api/embed`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: cfg.model, input: text.slice(0, 8_000) }), signal: controller.signal })
    if (!res.ok) throw new Error(`Ollama embeddings failed (${res.status})`)
    return ((await res.json()) as { embeddings: number[][] }).embeddings[0]
  } finally {
    clearTimeout(timer)
  }
}
