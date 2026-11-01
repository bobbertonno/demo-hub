import { Badge } from '@/components/lg'
import { MATURITY_LABELS, STATUS_LABELS } from '@/lib/seed/capability-labels'

type Variant = 'lightgray' | 'darkgray' | 'red' | 'yellow' | 'blue' | 'green' | 'purple'

const statusVariant: Record<string, Variant> = { draft: 'yellow', in_review: 'blue', published: 'green', archived: 'darkgray' }
const maturityVariant: Record<string, Variant> = { concept: 'lightgray', prototype: 'purple', beta: 'blue', stable: 'green', deprecated: 'red' }
const docVariant: Record<string, Variant> = { missing: 'red', template: 'yellow', partial: 'blue', verified: 'green' }
const docLabel: Record<string, string> = { missing: 'Docs missing', template: 'Template docs', partial: 'Partially verified', verified: 'Verified docs' }

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusVariant[status] ?? 'lightgray'}>{STATUS_LABELS[status] ?? status}</Badge>
}

export function MaturityBadge({ maturity }: { maturity: string }) {
  return <Badge variant={maturityVariant[maturity] ?? 'lightgray'}>{MATURITY_LABELS[maturity] ?? maturity}</Badge>
}

export function DocStatusBadge({ status }: { status: string }) {
  return <Badge variant={docVariant[status] ?? 'lightgray'}>{docLabel[status] ?? status}</Badge>
}

export function ProvenanceBadge({ provenance }: { provenance: 'repository' | 'catalog' | 'template' }) {
  if (provenance === 'repository') return <Badge variant="green">Verified · from repository</Badge>
  if (provenance === 'catalog') return <Badge variant="blue">Catalog metadata</Badge>
  return <Badge variant="yellow">Template · not verified</Badge>
}

export function ThemeModeBadge({ mode, customerName }: { mode: string; customerName?: string }) {
  if (mode === 'mongodb') return <Badge variant="green">MongoDB LeafyGreen theme</Badge>
  if (mode === 'customer') return <Badge variant="purple">Customer theme{customerName ? `: ${customerName}` : ''}</Badge>
  return <Badge variant="lightgray">Custom theme</Badge>
}
