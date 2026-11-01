import { NextResponse } from 'next/server'
import { isAuthAvailable } from '@/lib/auth/auth'
import { browsingRequiresAuth, getCurrentUser } from '@/lib/auth/session'
import { isDevAuthEnabled, isSsoConfigured } from '@/lib/config/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getCurrentUser()
  return NextResponse.json({
    authenticated: Boolean(user),
    user: user ? { email: user.email, name: user.name, role: user.role, authMethod: user.authMethod } : null,
    ssoConfigured: isSsoConfigured(),
    devAuthEnabled: isDevAuthEnabled(),
    authAvailable: isAuthAvailable(),
    browsingRequiresAuth: browsingRequiresAuth(),
  })
}
