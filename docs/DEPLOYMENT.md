# Running the Demo Hub locally

The Hub runs in local mode: there is no sign-in and every visitor has full access. Run it only on a trusted machine or network.

## Option A: Docker (recommended)

```bash
docker compose --profile app up -d --build
```

This starts MongoDB Community (replica set), MongoDB Community Search (`mongot`), a one-time setup job and the app at http://localhost:3000. The catalog is initialized automatically on first start. Ports are bound to `127.0.0.1` only.

## Option B: Node.js with your own MongoDB

```bash
pnpm install
cp .env.example .env.local
# set MONGODB_URI to a local MongoDB or an Atlas cluster
pnpm db:migrate && pnpm db:seed
pnpm dev
```

## GitHub sync

- Read-only access with a GitHub App (Contents: read, Metadata: read), or a fine-grained read-only token in `GITHUB_TOKEN`.
- Webhook: `POST /api/github/webhook` with the secret in `GITHUB_WEBHOOK_SECRET` (push events).
- Scheduled sync: call `POST /api/sync/scheduled` with `Authorization: Bearer <CRON_SECRET>` from any scheduler (for example cron).

## Screenshot uploads

Uploads are written to `ASSET_STORAGE_DIR` (default `./.data/assets`) and served by the app. Screenshots can also be added by HTTPS URL.

## Checklist

- [ ] `pnpm db:migrate` run against the target database
- [ ] GitHub credentials are read-only
- [ ] The Hub is reachable only from trusted machines
