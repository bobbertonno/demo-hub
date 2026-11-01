import { ATLAS_CORE_ILLUSTRATIVE_NODES_PER_SHARD, ATLAS_CORE_ILLUSTRATIVE_SHARDS, ATLAS_INFINITE_COMPUTE_NODES } from '@/lib/seed/demos'

function Node({ label, tone = 'compute', large }: { label: string; tone?: 'compute' | 'primary' | 'secondary'; large?: boolean }) {
  const styles = {
    compute: 'border-leaf bg-leaf/15 text-foreground',
    primary: 'border-leaf-dark bg-leaf-dark/20 text-foreground',
    secondary: 'border-border bg-surface text-muted-foreground',
  }[tone]
  return <div className={`flex items-center justify-center rounded-lg border-2 font-medium ${styles} ${large ? 'h-20 px-6 text-lg' : 'h-10 px-3 text-xs'}`}>{label}</div>
}

/** Illustrative sharded Atlas Core: 3 shards × 3 nodes = 9 nodes. Not a universal requirement. */
export function AtlasCoreDiagram({ large = false, loadFactor = 1 }: { large?: boolean; loadFactor?: number }) {
  const shards = Array.from({ length: ATLAS_CORE_ILLUSTRATIVE_SHARDS }, (_, i) => i + 1)
  return (
    <figure className="flex flex-col gap-4" data-testid="atlas-core-diagram">
      <div className="flex justify-center">
        <Node label="mongos routers" tone="secondary" large={large} />
      </div>
      <div className={`grid grid-cols-3 ${large ? 'gap-6' : 'gap-3'}`}>
        {shards.map((s) => (
          <div key={s} className="flex flex-col gap-2 rounded-xl border border-dashed p-3">
            <p className={`text-center font-semibold ${large ? 'text-lg' : 'text-xs'}`}>Shard {s}</p>
            {Array.from({ length: ATLAS_CORE_ILLUSTRATIVE_NODES_PER_SHARD }, (_, n) => (
              <Node key={n} label={n === 0 ? 'Primary' : `Secondary ${n}`} tone={n === 0 ? 'primary' : 'secondary'} large={large} />
            ))}
            <div className="mt-1 h-1.5 overflow-hidden rounded bg-surface" aria-hidden>
              <div className="h-full bg-leaf-dark transition-all" style={{ width: `${Math.min(100, 30 * loadFactor)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <figcaption className={`text-center text-muted-foreground ${large ? 'text-base' : 'text-xs'}`}>
        Illustrative configuration: {ATLAS_CORE_ILLUSTRATIVE_SHARDS} shards × {ATLAS_CORE_ILLUSTRATIVE_NODES_PER_SHARD} nodes ={' '}
        <span data-testid="atlas-core-node-count">{ATLAS_CORE_ILLUSTRATIVE_SHARDS * ATLAS_CORE_ILLUSTRATIVE_NODES_PER_SHARD}</span> nodes. Compute and storage scale together per shard. Not a universal requirement.
      </figcaption>
    </figure>
  )
}

/** Educational Atlas Infinite scenario: exactly TWO compute nodes over a shared storage layer. */
export function AtlasInfiniteDiagram({ large = false, storageFill = 0.3 }: { large?: boolean; storageFill?: number }) {
  return (
    <figure className="flex flex-col gap-4" data-testid="atlas-infinite-diagram">
      <p className={`text-center font-semibold ${large ? 'text-lg' : 'text-xs'}`}>Compute layer</p>
      <div className={`grid grid-cols-2 ${large ? 'gap-6' : 'gap-3'}`}>
        {Array.from({ length: ATLAS_INFINITE_COMPUTE_NODES }, (_, i) => (
          <div key={i} data-testid="atlas-infinite-compute-node">
            <Node label={`Compute node ${i + 1}`} large={large} />
          </div>
        ))}
      </div>
      <div className="flex justify-center" aria-hidden>
        <div className="h-8 w-px bg-border" />
      </div>
      <div className="rounded-xl border-2 border-leaf-dark p-4">
        <p className={`text-center font-semibold ${large ? 'text-lg' : 'text-xs'}`}>Separated storage layer</p>
        <div className="mt-3 h-3 overflow-hidden rounded bg-surface" aria-hidden>
          <div className="h-full bg-leaf transition-all" style={{ width: `${Math.round(Math.min(1, storageFill) * 100)}%` }} />
        </div>
      </div>
      <figcaption className={`text-center text-muted-foreground ${large ? 'text-base' : 'text-xs'}`}>
        Educational scenario with <span data-testid="atlas-infinite-node-count">{ATLAS_INFINITE_COMPUTE_NODES}</span> compute nodes. Storage grows independently of compute. Limits and scaling times are not asserted here.
      </figcaption>
    </figure>
  )
}
