/** Validates demo.yaml files. Usage: pnpm manifests:validate [path ...] (defaults to manifests/*\/demo.yaml) */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { DemoManifest } from '../lib/schemas/manifest'

const args = process.argv.slice(2)
const files = args.length
  ? args
  : readdirSync('manifests', { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => join('manifests', d.name, 'demo.yaml'))
      .filter((f) => existsSync(f))

let failed = 0
for (const file of files) {
  const result = DemoManifest.safeParse(parse(readFileSync(file, 'utf8')))
  if (result.success) console.log(`ok   ${file}`)
  else {
    failed++
    console.error(`FAIL ${file}`)
    for (const issue of result.error.issues) console.error(`     ${issue.path.join('.') || '(root)'}: ${issue.message}`)
  }
}
process.exit(failed ? 1 : 0)
