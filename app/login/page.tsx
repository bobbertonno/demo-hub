import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Callout } from '@/components/lg'
import { Container } from '@/components/shared/page'
import { HubLogo } from '@/components/layout/hub-logo'
import { DEV_ACCOUNTS } from '@/lib/auth/roles'
import { getCurrentUser } from '@/lib/auth/session'
import { getEnv, isDevAuthEnabled, isSsoConfigured } from '@/lib/config/env'
import { devSignInAction, ssoSignInAction } from './actions'

export const metadata: Metadata = { title: 'Sign in' }

const ERRORS: Record<string, string> = {
  AccessDenied: 'Access denied. Your identity could not be verified as an allowed MongoDB corporate account.',
  NotConfigured: 'Corporate SSO is not configured for this deployment.',
  DevDisabled: 'Development accounts are disabled in this environment.',
  InvalidAccount: 'Unknown development account.',
  Configuration: 'Authentication configuration error. Contact a Hub administrator.',
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const { callbackUrl: rawCallback, error } = await searchParams
  const callbackUrl = rawCallback?.startsWith('/') && !rawCallback.startsWith('//') ? rawCallback : '/'
  if (await getCurrentUser()) redirect(callbackUrl)
  const sso = isSsoConfigured()
  const dev = isDevAuthEnabled()
  const providerName = getEnv().OIDC_PROVIDER_NAME

  return (
    <div className="bg-hero py-16 text-hero-foreground">
      <Container className="flex justify-center">
        <div className="w-full max-w-md rounded-2xl bg-background p-8 text-foreground shadow-xl">
          <div className="flex items-center gap-3">
            <HubLogo />
            <div>
              <h1 className="text-xl font-semibold">Sign in to Demo Hub</h1>
              <p className="text-sm text-muted-foreground">MongoDB corporate access only</p>
            </div>
          </div>

          {error && (
            <div className="mt-6" role="alert">
              <Callout variant="warning" title="Sign-in failed">
                {ERRORS[error] ?? 'Sign-in failed.'}
              </Callout>
            </div>
          )}

          {sso ? (
            <form action={ssoSignInAction} className="mt-6">
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
              <button type="submit" className="w-full rounded-lg bg-forest px-4 py-3 text-sm font-semibold text-white hover:bg-[#00684A]">
                Continue with {providerName}
              </button>
              <p className="mt-3 text-xs text-muted-foreground">ID token signature, issuer, audience, expiry and verified corporate email are checked server-side.</p>
            </form>
          ) : (
            <div className="mt-6">
              <Callout variant="important" title="Corporate SSO is not configured">
                Set OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET and AUTH_SECRET. Protected areas stay locked until SSO is configured — there is no public bypass.
              </Callout>
            </div>
          )}

          {dev && (
            <div className="mt-8 rounded-xl border-2 border-dashed border-yellow-400 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-yellow-700 dark:text-yellow-300">Development only — DEV_AUTH_MODE</p>
              <p className="mt-1 text-xs text-muted-foreground">These accounts exist only in local development and are disabled in production and Vercel previews by default.</p>
              <ul className="mt-4 flex flex-col gap-2">
                {DEV_ACCOUNTS.map((a) => (
                  <li key={a.email}>
                    <form action={devSignInAction}>
                      <input type="hidden" name="email" value={a.email} />
                      <input type="hidden" name="callbackUrl" value={callbackUrl} />
                      <button type="submit" className="flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm hover:bg-surface" data-testid={`dev-login-${a.role}`}>
                        <span>{a.name}</span>
                        <span className="rounded bg-surface px-2 py-0.5 text-xs font-semibold uppercase">{a.role}</span>
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Container>
    </div>
  )
}
