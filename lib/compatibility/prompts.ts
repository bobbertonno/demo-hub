import { CANONICAL_STRUCTURE, IMPLEMENTATION_LEVELS, MANIFEST_PATH, STANDARD_VERSION, manifestCapabilityIds, manifestJsonSchema } from './standard'

export const PROMPT_TEMPLATE_VERSION = '1.0.0'

export type PromptPlatform = 'v0' | 'claude-code' | 'codex'

export const PROMPT_PLATFORMS: { id: PromptPlatform; name: string; description: string; openUrl: string; openLabel: string }[] = [
  { id: 'v0', name: 'v0', description: 'Paste into a v0 chat connected to the demo repository. v0 will add the files and open a pull request.', openUrl: 'https://v0.app', openLabel: 'Open v0' },
  { id: 'claude-code', name: 'Claude Code', description: 'Run inside the repository with Claude Code. It inspects the code before writing any documentation.', openUrl: 'https://claude.com/product/claude-code', openLabel: 'Open Claude Code' },
  { id: 'codex', name: 'OpenAI Codex', description: 'Use in Codex with the repository checked out. Works from the CLI or the Codex cloud agent.', openUrl: 'https://chatgpt.com/codex', openLabel: 'Open Codex' },
]

const EXAMPLE_MANIFEST = {
  schemaVersion: STANDARD_VERSION,
  name: 'Atlas Document Hub',
  description: 'Document management demo using MongoDB Atlas.',
  category: 'Document Management',
  authors: [{ name: 'Demo Owner', github: 'demo-owner' }],
  tags: ['mongodb', 'atlas', 'search'],
  technologies: ['Next.js', 'Node.js'],
  mongodbCapabilities: [
    { id: 'mongodb-search', description: 'Full-text document search over titles and extracted content.', implementation: 'Verified implementation', evidence: ['src/lib/search.ts'] },
  ],
  deployment: { local: { supported: true, command: 'docker compose up' }, atlas: { supported: true } },
  screenshots: [{ path: 'demo-hub/screenshots/home.png', caption: 'Main dashboard' }],
  architecture: { documentation: 'demo-hub/architecture.md', diagram: 'demo-hub/diagrams/architecture.mmd' },
  documentation: { readme: 'README.md' },
}

const PLATFORM_INTRO: Record<PromptPlatform, string> = {
  v0: 'You are working in v0 on an existing GitHub repository that contains a MongoDB demo. Read the repository files before writing anything, then add the Demo Hub assets described below and commit them on a branch with a pull request.',
  'claude-code': 'You are Claude Code running inside the root of an existing MongoDB demo repository. Use your file reading and search tools to analyze the codebase first. Do not run destructive commands. Create or update only the files described below.',
  codex: 'You are Codex working in an existing MongoDB demo repository. Inspect the code with read-only commands first, then create or update only the files described below. Keep the change in a single, reviewable commit.',
}

export function buildPrompt(platform: PromptPlatform): string {
  const structure = CANONICAL_STRUCTURE.map((s) => `- ${s.path}${s.required ? ' (required)' : ' (optional)'}: ${s.purpose}`).join('\n')
  return `${PLATFORM_INTRO[platform]}

# Goal
Make this repository fully compatible with MongoDB Demo Hub standard v${STANDARD_VERSION} (prompt template v${PROMPT_TEMPLATE_VERSION}).

# Required analysis
Before generating content, inspect the repository and identify:
- Application architecture and main components
- Technologies, frameworks and package dependencies
- How MongoDB is used: driver calls, collections, aggregation pipelines, $search, $vectorSearch, change streams, transactions, stream processing
- Deployment approach (Docker, scripts, Atlas setup) and required environment variables
- User workflows and important features

# Accuracy rules
- Only document capabilities you can prove from the code. Every entry in mongodbCapabilities must list the source files that implement it in "evidence".
- Do not invent features, metrics, customers or integrations.
- Use implementation "${IMPLEMENTATION_LEVELS[0]}" only when the code path exists and runs; use "${IMPLEMENTATION_LEVELS[1]}" for incomplete code and "${IMPLEMENTATION_LEVELS[2]}" for documentation-only concepts.
- Never write secrets, connection strings with credentials, or API keys into any file. Use placeholder names in configuration.
- Every path in the manifest must be repository-relative and must exist after your change.

# Files to create or update
${structure}

# README.md
Keep existing content. Make sure it has: Overview, Features, Prerequisites, Installation, Running locally, Running against MongoDB Atlas, Configuration, Troubleshooting. Use fenced code blocks for commands.

# ${MANIFEST_PATH}
Valid JSON matching the schema below. Allowed capability ids: ${manifestCapabilityIds.join(', ')}.
Example:
\`\`\`json
${JSON.stringify(EXAMPLE_MANIFEST, null, 2)}
\`\`\`

# demo-hub/architecture.md
Explain the components, how data flows through MongoDB, the collections and indexes used, and how search or AI features work. Reference real file paths.

# demo-hub/diagrams/architecture.mmd
A single Mermaid diagram (start with "flowchart LR" or "flowchart TD") showing users, application services, MongoDB collections and external services. Use only nodes that exist in the code. No HTML, no click handlers, no styling directives.

# demo-hub/screenshots/
If the app can run, capture 2-6 PNG screenshots of key screens and reference them in the manifest with captions. If you cannot capture them, omit the "screenshots" entries instead of inventing files.

# Validation checklist (run before finishing)
1. ${MANIFEST_PATH} parses as JSON and conforms to the schema below.
2. Every path referenced in the manifest exists.
3. Every capability has evidence pointing at real source files.
4. The Mermaid file renders (no syntax errors).
5. No secrets were added.

# Manifest JSON Schema (Demo Hub standard v${STANDARD_VERSION})
\`\`\`json
${JSON.stringify(manifestJsonSchema(), null, 2)}
\`\`\`
`
}
