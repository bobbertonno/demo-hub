import type { Metadata } from 'next'
import { Download } from 'lucide-react'
import { ManifestValidator } from '@/components/compatibility/manifest-validator'
import { PromptCard } from '@/components/compatibility/prompt-card'
import { Container } from '@/components/shared/page'
import { PROMPT_PLATFORMS, PROMPT_TEMPLATE_VERSION, buildPrompt } from '@/lib/compatibility/prompts'
import { CANONICAL_STRUCTURE, MANIFEST_PATH, STANDARD_VERSION } from '@/lib/compatibility/standard'

export const metadata: Metadata = {
  title: 'Prepare Your Demo',
  description: 'Make a GitHub demo repository fully compatible with MongoDB Demo Hub using AI-assisted prompts and the manifest standard.',
}

const LEVELS = [
  { name: 'Basic', text: 'Imported from GitHub metadata and README. Content is inferred and capabilities are marked unverified.' },
  { name: 'Enhanced', text: 'README plus architecture documentation, Mermaid diagrams or screenshots in the repository.' },
  { name: 'Fully Compatible', text: `A valid ${MANIFEST_PATH} whose referenced files all exist. Manifest data takes priority over inference.` },
]

export default function CompatibilityPage() {
  return (
    <>
      <section className="bg-hero text-hero-foreground">
        <Container className="py-12 md:py-16">
          <p className="inline-block rounded-md bg-leaf px-2.5 py-1 text-xs font-semibold text-forest">Standard v{STANDARD_VERSION}</p>
          <h1 className="mt-4 text-balance text-4xl font-semibold md:text-5xl">Prepare Your Demo</h1>
          <p className="mt-4 max-w-3xl text-pretty text-lg text-white/75">
            Any GitHub repository can be imported with just its URL. Follow this standard to unlock a richer catalog entry with verified capabilities, architecture and screenshots.
          </p>
          <a href="/api/compatibility/schema" download className="mt-8 inline-flex items-center gap-2 rounded-md bg-leaf px-4 py-2.5 text-sm font-semibold text-forest hover:bg-[#71F6BA]">
            <Download className="size-4" aria-hidden />
            Download manifest JSON Schema
          </a>
        </Container>
      </section>

      <Container className="flex flex-col gap-14 py-12">
        <section aria-labelledby="levels-heading" className="flex flex-col gap-4">
          <h2 id="levels-heading" className="text-2xl font-semibold">Compatibility levels</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {LEVELS.map((l, i) => (
              <li key={l.name} className="rounded-xl border p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Level {i + 1}</p>
                <h3 className="mt-1 text-lg font-semibold">{l.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{l.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="structure-heading" className="flex flex-col gap-4">
          <h2 id="structure-heading" className="text-2xl font-semibold">Repository structure</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface">
                <tr><th className="p-3">Path</th><th className="p-3">Status</th><th className="p-3">Purpose</th></tr>
              </thead>
              <tbody>
                {CANONICAL_STRUCTURE.map((s) => (
                  <tr key={s.path} className="border-t align-top">
                    <td className="p-3"><code>{s.path}</code></td>
                    <td className="p-3">{s.required ? 'Required' : 'Optional'}</td>
                    <td className="p-3 text-muted-foreground">{s.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground">
            Manifest priority on import: manifest data, then repository documentation, then GitHub metadata, then deterministic code analysis. Fields edited by an admin are never overwritten.
          </p>
        </section>

        <section aria-labelledby="prompts-heading" className="flex flex-col gap-4">
          <div>
            <h2 id="prompts-heading" className="text-2xl font-semibold">AI preparation prompts</h2>
            <p className="mt-1 text-sm text-muted-foreground">Prompt template v{PROMPT_TEMPLATE_VERSION}. Each prompt embeds the current JSON Schema and validation checklist.</p>
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            {PROMPT_PLATFORMS.map((p) => (
              <PromptCard key={p.id} id={p.id} name={p.name} description={p.description} prompt={buildPrompt(p.id)} openUrl={p.openUrl} openLabel={p.openLabel} version={PROMPT_TEMPLATE_VERSION} />
            ))}
          </div>
        </section>

        <section aria-labelledby="validate-heading" className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 id="validate-heading" className="text-2xl font-semibold">Validate before you import</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>The manifest must be valid JSON with <code>schemaVersion</code> 1.x. Unknown fields are kept for forward compatibility.</li>
              <li>Every path in the manifest must exist in the repository, or the level drops to Enhanced.</li>
              <li>Capabilities need source file evidence. Inferred capabilities are always shown as unverified.</li>
              <li>After merging, use <strong>Sync Repository</strong> on the demo page to re-assess.</li>
            </ul>
          </div>
          <ManifestValidator />
        </section>
      </Container>
    </>
  )
}
