# MongoDB Demo Hub – Solutions Architect Edition

Internal catalog, documentation portal, architecture explorer and distribution hub for MongoDB Solutions Architect demos.

The Hub **does not run or deploy demos**. It links to each demo's own GitHub repository and shows that repository's documentation, architecture, screenshots, prerequisites and setup instructions. It also explains how to run each demo locally or against your own Atlas organization.

## Stack

- Next.js App Router, TypeScript (strict), React 19
- Official `@leafygreen-ui/*` components and `@leafygreen-ui/tokens`
- MongoDB Node.js driver, with MongoDB Atlas as the production catalog database
- Zod (manifest and API validation), Mermaid (diagrams), Vitest and Playwright

## Runtime modes

| Mode | When | Behaviour |
| --- | --- | --- |
| **Read-only seed catalog** | `MONGODB_URI` unset | The four DRAFT seed demos are served from code. All writes return `503` with a setup message. A banner shows the mode. |
| **Local MongoDB** | `docker compose up -d` and `MONGODB_URI=mongodb://localhost:27017` | Full CRUD, audit log, sync metadata |
| **Atlas** | Atlas connection string | Same as local MongoDB |

## Quick start

```bash
pnpm install
cp .env.example .env.local        # placeholders only; fill in locally
docker compose up -d              # optional local MongoDB
pnpm db:migrate && pnpm db:seed   # idempotent; never overwrites admin edits
pnpm dev
```

To run the full stack (app, MongoDB and Community Search) in Docker:

```bash
docker compose --profile app up -d --build
```

## Access

The Hub runs in **local mode** with no sign-in and no user accounts. Every visitor has full access, including admin features. It binds to `127.0.0.1` in Docker; run it only on a trusted machine or network. Mutations are still validated, rate limited and recorded in `audit_logs` under a local operator identity.

Uploaded screenshots are stored on local disk under `ASSET_STORAGE_DIR` (default `./.data/assets`).

## GitHub integration

- Read-only access via a GitHub App (`GITHUB_APP_ID`, `GITHUB_PRIVATE_KEY`, `GITHUB_APP_INSTALLATION_ID`) or a fine-grained read token (`GITHUB_TOKEN`).
- Requests go only to `api.github.com`. Repository paths and refs are validated (SSRF and path traversal protection), and conditional `If-None-Match` requests use stored ETags.
- Sync fetches `README.md`, an optional `demo.yaml`, and diagrams and screenshots listed in the manifest. Results are stored in `documentation_snapshots`, and every run is recorded in `github_sync_jobs`.
- If a sync fails, the last successful snapshot is kept and a stale-content warning is shown.
- Markdown is sanitized: scripts, event handlers, iframes and `javascript:` URLs are removed. Images are limited to the repository's raw host.
- Sync triggers: manual (admin), scheduled (`POST /api/sync/scheduled` with `Authorization: Bearer $CRON_SECRET`), and webhook (`POST /api/github/webhook`, verified with `X-Hub-Signature-256` HMAC).
- Repository metadata never silently overwrites the README. Conflicts are recorded. Admins can download a suggested README patch; the Hub never pushes changes.

## Manifest (`demo.yaml`)

The schema is in `lib/schemas/manifest.ts` (Zod), with a JSON Schema at `manifests/demo.schema.json`. Example manifests for all four seed demos are in `manifests/<slug>/demo.yaml`.

```bash
pnpm manifests:export     # regenerate examples + JSON Schema
pnpm manifests:validate   # validate manifests (or pass paths)
```

Setup steps have a `provenance` of `repository` (VERIFIED) or `template` (TEMPLATE). Only steps taken from a synced repository are shown as verified.

## Database

Collections: `demos`, `capabilities`, `demo_assets`, `documentation_snapshots`, `github_sync_jobs`, `audit_logs`, `catalog_settings`. Migrations (`lib/db/migrations.ts`) create these indexes:

- unique `slug`
- `status`
- `capabilities.capability`
- repository identity
- sync status
- filter fields

## Seed catalog

The four demos below are seeded with **DRAFT** status. Each has `repository: null` and no screenshots, and all its setup steps are TEMPLATE. Atlas Infinite product facts (storage limits, scaling times, availability, migration guarantees) are versioned `unverified` metadata that admins can edit; they are not presented as facts.

- Atlas Document Hub
- Intelligent Workflow Automation
- Digital Euro Single View Audit
- Atlas Infinite: Scale Without Limits

The Atlas Infinite educational diagram shows exactly two compute nodes. The Atlas Core comparison uses an illustrative 3 × 3 = 9 node layout. The migration center runs a client-side **SIMULATION** only; real migration is never started by the Hub.

## Theme metadata

A demo's `themeMode` (`mongodb` | `customer` | `custom`) and `customerTheme` only affect that demo's preview images and documentation badges. The Hub shell always uses LeafyGreen.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint (typescript-eslint) |
| `pnpm test` | Vitest unit/integration tests |
| `pnpm test:e2e` | Playwright (desktop + mobile) |
| `pnpm db:migrate` / `pnpm db:seed` | Idempotent DB setup |

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for running the Hub locally.
