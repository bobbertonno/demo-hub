export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { startBackgroundServices } = await import('./lib/jobs/startup')
  startBackgroundServices()
}
