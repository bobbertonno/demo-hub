import 'server-only'
import { randomUUID } from 'node:crypto'
import { isDatabaseConfigured } from '@/lib/config/env'
import { COLLECTIONS, getCollection } from '@/lib/db/mongo'
import { DemoInput } from '@/lib/schemas/manifest'
import { NotFoundError, ReadOnlyCatalogError, createDemo, getDemoBySlug, updateDemo } from './repository'

export type ChangeProposal = {
  id: string
  demoSlug: string
  kind: 'create' | 'update'
  payload: DemoInput
  note: string
  status: 'pending' | 'approved' | 'rejected'
  proposedBy: string
  createdAt: string
  reviewedBy: string | null
  reviewedAt: string | null
  reviewNote: string | null
}

export async function createProposal(input: { payload: unknown; note: string; slug?: string }, proposedBy: string): Promise<ChangeProposal> {
  if (!isDatabaseConfigured()) throw new ReadOnlyCatalogError()
  const payload = DemoInput.parse(input.payload)
  const existing = await getDemoBySlug(input.slug ?? payload.slug)
  const proposal: ChangeProposal = {
    id: randomUUID(),
    demoSlug: existing?.slug ?? payload.slug,
    kind: existing ? 'update' : 'create',
    payload,
    note: input.note.slice(0, 2000),
    status: 'pending',
    proposedBy,
    createdAt: new Date().toISOString(),
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
  }
  const col = await getCollection<ChangeProposal>(COLLECTIONS.changeProposals)
  await col.insertOne({ ...proposal })
  return proposal
}

export async function listProposals(status?: ChangeProposal['status']): Promise<ChangeProposal[]> {
  if (!isDatabaseConfigured()) return []
  const col = await getCollection<ChangeProposal>(COLLECTIONS.changeProposals)
  return col
    .find(status ? { status } : {}, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray()
}

export async function reviewProposal(id: string, decision: 'approved' | 'rejected', reviewer: string, reviewNote: string): Promise<ChangeProposal> {
  if (!isDatabaseConfigured()) throw new ReadOnlyCatalogError()
  const col = await getCollection<ChangeProposal>(COLLECTIONS.changeProposals)
  const proposal = await col.findOne({ id, status: 'pending' }, { projection: { _id: 0 } })
  if (!proposal) throw new NotFoundError('Pending proposal not found')
  if (decision === 'approved') {
    if (proposal.kind === 'create') await createDemo(proposal.payload)
    else await updateDemo(proposal.demoSlug, proposal.payload)
  }
  const reviewed = { status: decision, reviewedBy: reviewer, reviewedAt: new Date().toISOString(), reviewNote: reviewNote.slice(0, 2000) }
  await col.updateOne({ id }, { $set: reviewed })
  return { ...proposal, ...reviewed }
}
