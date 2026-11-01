/** Writes manifests/<slug>/demo.yaml for each seed demo plus manifests/demo.schema.json. Usage: pnpm manifests:export */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { stringify } from 'yaml'
import { z } from 'zod'
import { DemoManifest } from '../lib/schemas/manifest'
import { seedDemos } from '../lib/seed/demos'

const root = join(process.cwd(), 'manifests')
mkdirSync(root, { recursive: true })

for (const demo of seedDemos) {
  const manifest = DemoManifest.parse(demo)
  const dir = join(root, manifest.slug)
  mkdirSync(dir, { recursive: true })
  const header = `# demo.yaml — example manifest for ${manifest.title}\n# Place this file at the root of the demo repository. Status DRAFT until verified.\n# Validate with: pnpm manifests:validate\n`
  writeFileSync(join(dir, 'demo.yaml'), header + stringify(manifest, { lineWidth: 120 }))
  console.log(`wrote manifests/${manifest.slug}/demo.yaml`)
}

writeFileSync(join(root, 'demo.schema.json'), JSON.stringify(z.toJSONSchema(DemoManifest, { io: 'input' }), null, 2) + '\n')
console.log('wrote manifests/demo.schema.json')
