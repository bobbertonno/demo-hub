'use client'

import Badge from '@leafygreen-ui/badge'
import { Cell, HeaderCell, HeaderRow, Row, Table, TableBody, TableHead } from '@/components/lg'
import Link from 'next/link'
import { capabilityLabel } from '@/lib/seed/capability-labels'
import type { CapabilityMapping } from '@/lib/schemas/manifest'

export function CapabilityMatrix({ capabilities }: { capabilities: CapabilityMapping[] }) {
  if (!capabilities.length) return <p className="text-sm text-muted-foreground">No capability mapping documented yet.</p>
  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHead>
          <HeaderRow>
            <HeaderCell>Capability</HeaderCell>
            <HeaderCell>Why it is used</HeaderCell>
            <HeaderCell>Implementation location</HeaderCell>
            <HeaderCell>Business value</HeaderCell>
          </HeaderRow>
        </TableHead>
        <TableBody>
          {capabilities.map((c) => (
            <Row key={c.capability}>
              <Cell>
                <div className="flex flex-col items-start gap-1 py-2">
                  <Link href={`/capabilities/${c.capability}`} className="font-semibold text-accent hover:underline">
                    {capabilityLabel(c.capability)}
                  </Link>
                  <Badge variant={c.verified ? 'green' : 'yellow'}>{c.verified ? 'Verified in repo' : 'Unverified'}</Badge>
                </div>
              </Cell>
              <Cell>{c.whyUsed}</Cell>
              <Cell>{c.implementationLocation ? <code className="text-xs">{c.implementationLocation}</code> : <span className="text-muted-foreground">Not yet documented</span>}</Cell>
              <Cell>{c.businessValue ?? <span className="text-muted-foreground">—</span>}</Cell>
            </Row>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
