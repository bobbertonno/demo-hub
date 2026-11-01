# Deploying the Demo Hub to Vercel

## 1. MongoDB Atlas
1. Create a dedicated cluster/project for the catalog and a database user with `readWrite` on `MONGODB_DB` only.
2. Restrict Network Access to the egress you use (Vercel Secure Compute / static IPs where available). Avoid `0.0.0.0/0` for production.
3. Run migrations and seed once from a trusted machine:
   ```bash
   MONGODB_URI="<atlas-uri>" MONGODB_DB=demo_hub pnpm db:migrate
   MONGODB_URI="<atlas-uri>" MONGODB_DB=demo_hub pnpm db:seed
   ```

## 2. Identity provider (OIDC)
1. Register a confidential web client in the corporate IdP.
2. Redirect URI: `https://<hub-domain>/api/auth/callback/oidc`.
3. Scopes: `openid email profile`. The IdP must emit `email` and `email_verified`.
4. Set `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `ALLOWED_EMAIL_DOMAINS`, `AUTH_SECRET` (`openssl rand -base64 32`) and optionally `INITIAL_ADMIN_EMAILS`.

## 3. GitHub
- Preferred: create a GitHub App with **Repository contents: Read** and **Metadata: Read**, install it on the demo repositories, and set `GITHUB_APP_ID`, `GITHUB_PRIVATE_KEY` (PEM, `\n` escaped is accepted), `GITHUB_APP_INSTALLATION_ID`.
- Webhook: URL `https://<hub-domain>/api/github/webhook`, content type JSON, secret `GITHUB_WEBHOOK_SECRET`, events `push`.
- Scheduled sync: add a Vercel Cron that calls `POST /api/sync/scheduled`, and set `CRON_SECRET`. Vercel sends it as `Authorization: Bearer <CRON_SECRET>`.

## 4. Screenshot storage
Connect Vercel Blob and set `BLOB_READ_WRITE_TOKEN`. Without it, the upload controls show a "storage not configured" state, and an admin can still add screenshots by HTTPS URL.

## 5. Vercel project settings
- Add all variables as **server-side** environment variables (Production and Preview). Do not set `DEV_AUTH_MODE` in Production.
- Preview deployments enforce SSO the same way as Production. Configure the IdP redirect URI for the preview domain, or protect previews with Vercel Deployment Protection.
- Security headers come from `next.config.mjs`. The CSP is currently `Report-Only`; tighten it and switch to an enforcing policy once reports are clean.

## 6. Verify
- `GET /api/health` reports database, SSO, GitHub and storage status, with secrets redacted.
- `/admin/settings` shows the SSO configuration status. `/admin/integrations` shows sync history and errors.
