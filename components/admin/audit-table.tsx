import { formatDateTime } from '@/components/shared/page'
import type { AuditEntry } from '@/lib/audit'

export function AuditTable({ entries, emptyLabel = 'No audit entries recorded yet.' }: { entries: AuditEntry[]; emptyLabel?: string }) {
  if (!entries.length) return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Audit history</caption>
        <thead className="bg-surface text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">
              When
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Actor
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Action
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Target
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Details
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {entries.map((e) => (
            <tr key={e.id} className="align-top">
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDateTime(e.at)}</td>
              <td className="px-4 py-3 text-foreground">
                {e.actorEmail}
                <span className="block text-xs text-muted-foreground">{e.actorRole}</span>
              </td>
              <td className="px-4 py-3">
                <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-foreground">{e.action}</code>
              </td>
              <td className="px-4 py-3 text-foreground">
                {e.target.type}
                {e.target.id ? `: ${e.target.id}` : ''}
              </td>
              <td className="max-w-md px-4 py-3 text-xs text-muted-foreground">
                {e.summary ? <span className="block text-foreground">{e.summary}</span> : null}
                {e.details ? <span className="line-clamp-3 break-all font-mono">{JSON.stringify(e.details)}</span> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
