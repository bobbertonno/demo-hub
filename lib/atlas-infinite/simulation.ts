export type SimulationStep = { id: string; title: string; description: string }

/** Educational steps only. Nothing here calls an API or mutates infrastructure. */
export const MIGRATION_SIMULATION_STEPS: SimulationStep[] = [
  { id: 'assessment', title: 'Assessment', description: 'Inventory workloads, data volume, query patterns and SLAs. In a real project this is done with the customer and documented.' },
  { id: 'compatibility', title: 'Compatibility checks', description: 'Review driver versions, features in use and operational tooling against official compatibility documentation.' },
  { id: 'transfer', title: 'Data transfer', description: 'Illustrates an initial sync followed by ongoing replication. The simulation moves no data.' },
  { id: 'validation', title: 'Validation', description: 'Compare counts, checksums and representative queries between source and target in a real migration.' },
  { id: 'cutover', title: 'Cutover', description: 'Plan a change window, redirect application connection strings and keep a rollback path.' },
  { id: 'verification', title: 'Post-migration verification', description: 'Monitor performance and errors, confirm business KPIs and decommission the source only after sign-off.' },
]
