import type { DemoRecord } from '@/lib/schemas/manifest'
import { capabilityLabel } from '@/lib/seed/capability-labels'

const BEGIN = '<!-- demo-hub:catalog-metadata:begin -->'
const END = '<!-- demo-hub:catalog-metadata:end -->'

/** Generates a suggested README block from catalog metadata. Never pushed automatically. */
export function buildCatalogSection(demo: DemoRecord): string {
  const lines = [
    BEGIN,
    '## MongoDB Demo Hub metadata',
    '',
    `> Suggested by MongoDB Demo Hub. Review before merging. Catalog maturity: **${demo.maturity}**.`,
    '',
    `**Summary:** ${demo.summary}`,
    '',
    '### MongoDB capabilities',
    '',
    '| Capability | Why it is used | Implementation location |',
    '| --- | --- | --- |',
    ...demo.capabilities.map((c) => `| ${capabilityLabel(c.capability)} | ${c.whyUsed.replace(/\|/g, '\\|')} | ${c.implementationLocation ?? '_to be documented_'} |`),
    '',
    '### Prerequisites',
    '',
    ...(demo.prerequisites.length ? demo.prerequisites.map((p) => `- ${p.name}${p.version ? ` ${p.version}` : ''}${p.check ? ` — ${p.check}` : ''}`) : ['- _to be documented_']),
    '',
    '### Configuration',
    '',
    ...(demo.configuration.length
      ? ['| Variable | Required | Secret | Description |', '| --- | --- | --- | --- |', ...demo.configuration.map((v) => `| \`${v.name}\` | ${v.required ? 'yes' : 'no'} | ${v.secret ? 'yes' : 'no'} | ${v.description} |`)]
      : ['_No configuration variables recorded in the catalog._']),
    '',
    `Maintainer: ${demo.maintainer.name}${demo.maintainer.team ? ` (${demo.maintainer.team})` : ''}`,
    END,
  ]
  return lines.join('\n')
}

export function proposeReadme(current: string | null, demo: DemoRecord): { proposed: string; patch: string } {
  const base = current ?? `# ${demo.title}\n\n${demo.summary}\n`
  const section = buildCatalogSection(demo)
  const start = base.indexOf(BEGIN)
  const end = base.indexOf(END)
  const proposed = start >= 0 && end > start ? `${base.slice(0, start)}${section}${base.slice(end + END.length)}` : `${base.replace(/\s*$/, '')}\n\n${section}\n`
  return { proposed, patch: unifiedDiff(base, proposed, demo.readmePath) }
}

/** Minimal line-based unified diff (single hunk) suitable for `git apply`. */
export function unifiedDiff(a: string, b: string, path: string): string {
  const al = a.split('\n')
  const bl = b.split('\n')
  let prefix = 0
  while (prefix < al.length && prefix < bl.length && al[prefix] === bl[prefix]) prefix++
  let suffix = 0
  while (suffix < al.length - prefix && suffix < bl.length - prefix && al[al.length - 1 - suffix] === bl[bl.length - 1 - suffix]) suffix++
  const ctx = Math.min(3, prefix)
  const startA = prefix - ctx
  const removed = al.slice(prefix, al.length - suffix)
  const added = bl.slice(prefix, bl.length - suffix)
  const tail = al.slice(al.length - suffix, Math.min(al.length, al.length - suffix + 3))
  const head = al.slice(startA, prefix)
  const lenA = head.length + removed.length + tail.length
  const lenB = head.length + added.length + tail.length
  return [
    `--- a/${path}`,
    `+++ b/${path}`,
    `@@ -${startA + 1},${lenA} +${startA + 1},${lenB} @@`,
    ...head.map((l) => ` ${l}`),
    ...removed.map((l) => `-${l}`),
    ...added.map((l) => `+${l}`),
    ...tail.map((l) => ` ${l}`),
    '',
  ].join('\n')
}
