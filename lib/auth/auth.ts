import 'server-only'
import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import { getEnv, isDevAuthEnabled, isSsoConfigured } from '@/lib/config/env'
import { DEV_ACCOUNTS } from './roles'
import { verifyCorporateIdToken } from './oidc'

export const OIDC_PROVIDER_ID = 'corporate-oidc'
export const DEV_PROVIDER_ID = 'dev-accounts'

// Development-only signing secret. Used solely when DEV_AUTH_MODE is active in a
// non-production environment and AUTH_SECRET is absent. Never used in production.
const DEV_ONLY_SECRET = 'dev-only-insecure-secret-do-not-use-in-production-0000'

export function isAuthAvailable(): boolean {
  return isSsoConfigured() || isDevAuthEnabled()
}

function buildConfig(): NextAuthConfig {
  const env = getEnv()
  const providers: NextAuthConfig['providers'] = []
  const sso = isSsoConfigured(env)
  const dev = isDevAuthEnabled(env)

  if (sso) {
    providers.push({
      id: OIDC_PROVIDER_ID,
      name: env.OIDC_PROVIDER_NAME,
      type: 'oidc',
      issuer: env.OIDC_ISSUER,
      clientId: env.OIDC_CLIENT_ID,
      clientSecret: env.OIDC_CLIENT_SECRET,
      checks: ['pkce', 'state', 'nonce'],
      authorization: { params: { scope: 'openid email profile' } },
    })
  }

  if (dev) {
    providers.push(
      Credentials({
        id: DEV_PROVIDER_ID,
        name: 'Development accounts',
        credentials: { email: { label: 'Account', type: 'text' } },
        authorize: async (raw) => {
          const parsed = z.object({ email: z.string().email() }).safeParse(raw)
          if (!parsed.success) return null
          const account = DEV_ACCOUNTS.find((a) => a.email === parsed.data.email)
          return account ? { id: account.email, email: account.email, name: account.name } : null
        },
      }),
    )
  }

  const crossSiteCookies = dev && !sso
  return {
    providers,
    secret: env.AUTH_SECRET ?? (dev ? DEV_ONLY_SECRET : undefined),
    trustHost: true,
    session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
    pages: { signIn: '/login', error: '/login' },
    // The v0 preview renders inside a cross-site iframe; dev-only cookies must be SameSite=None.
    cookies: crossSiteCookies
      ? {
          sessionToken: { name: 'hub.dev.session', options: { httpOnly: true, sameSite: 'none', secure: true, path: '/' } },
          csrfToken: { name: 'hub.dev.csrf', options: { httpOnly: true, sameSite: 'none', secure: true, path: '/' } },
          callbackUrl: { name: 'hub.dev.callback', options: { httpOnly: true, sameSite: 'none', secure: true, path: '/' } },
        }
      : undefined,
    callbacks: {
      async signIn({ account }) {
        if (account?.provider === DEV_PROVIDER_ID) return isDevAuthEnabled()
        if (account?.provider === OIDC_PROVIDER_ID) {
          if (!account.id_token) return false
          try {
            await verifyCorporateIdToken(account.id_token)
            return true
          } catch {
            return '/login?error=AccessDenied'
          }
        }
        return false
      },
      async jwt({ token, account, profile }) {
        if (account) {
          token.authMethod = account.provider === DEV_PROVIDER_ID ? 'dev' : 'oidc'
          if (profile?.email) token.email = String(profile.email).toLowerCase()
        }
        return token
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.email = typeof token.email === 'string' ? token.email : session.user.email
          ;(session as unknown as { authMethod?: string }).authMethod = typeof token.authMethod === 'string' ? token.authMethod : undefined
        }
        return session
      },
    },
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => buildConfig())
