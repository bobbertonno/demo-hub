import Link from 'next/link'
import { Container } from '@/components/shared/page'

const COPY = {
  unauthenticated: {
    title: 'Sign in required',
    body: 'The administration area requires an authenticated MongoDB corporate identity.',
    cta: true,
  },
  forbidden: {
    title: 'You do not have access to this page',
    body: 'Your role does not grant access to this area. Ask a Demo Hub admin to update your role if you need it.',
    cta: false,
  },
  'not-configured': {
    title: 'Authentication is not configured',
    body: 'No identity provider is configured, so protected areas are locked. Configure OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET and AUTH_SECRET, or enable DEV_AUTH_MODE for local development only.',
    cta: false,
  },
} as const

export function AccessState({ reason, path }: { reason: keyof typeof COPY; path: string }) {
  const copy = COPY[reason]
  return (
    <Container className="py-24">
      <div role="alert" className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">{reason === 'forbidden' ? '403' : '401'}</p>
        <h1 className="mt-3 text-balance text-2xl font-semibold text-foreground">{copy.title}</h1>
        <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">{copy.body}</p>
        <div className="mt-6 flex justify-center gap-3">
          {copy.cta ? (
            <Link href={`/login?callbackUrl=${encodeURIComponent(path)}`} className="rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-forest hover:bg-mint">
              Sign in
            </Link>
          ) : null}
          <Link href="/" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-background">
            Back to the Hub
          </Link>
        </div>
      </div>
    </Container>
  )
}
