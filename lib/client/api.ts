export type ApiIssue = { path: string; message: string }

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public issues: ApiIssue[] = [],
  ) {
    super(message)
  }
}

/** Browser-side JSON fetch that surfaces server validation issues. */
export async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && init.body instanceof FormData
  const headers = new Headers(init.headers)
  if (init.body && !isForm && !headers.has('content-type')) headers.set('content-type', 'application/json')
  const res = await fetch(url, { ...init, headers, credentials: 'same-origin' })
  const data = (await res.json().catch(() => ({}))) as { error?: string; issues?: ApiIssue[] }
  if (!res.ok) throw new ApiError(data.error ?? `Request failed (${res.status})`, res.status, data.issues ?? [])
  return data as T
}

export function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.issues.length) return `${err.message}: ${err.issues.map((i) => `${i.path || '(root)'} — ${i.message}`).join('; ')}`
    return err.message
  }
  return err instanceof Error ? err.message : 'Unexpected error'
}
