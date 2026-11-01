import type { DiagnosticItem } from '@/lib/config/env'

const TONE: Record<DiagnosticItem['status'], { label: string; className: string }> = {
  configured: { label: 'Configured', className: 'bg-accent/15 text-accent' },
  missing: { label: 'Missing', className: 'bg-red-500/15 text-red-600 dark:text-red-400' },
  'optional-missing': { label: 'Not configured', className: 'bg-surface text-muted-foreground border border-border' },
  disabled: { label: 'Disabled', className: 'bg-surface text-muted-foreground border border-border' },
}

export function DiagnosticsList({ items }: { items: DiagnosticItem[] }) {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {items.map((item) => {
        const tone = TONE[item.status]
        return (
          <li key={item.key} className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-foreground">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.detail}</p>
            </div>
            <span className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${tone.className}`}>{tone.label}</span>
          </li>
        )
      })}
    </ul>
  )
}
