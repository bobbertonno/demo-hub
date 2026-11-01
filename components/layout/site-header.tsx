import { getCurrentUser } from '@/lib/auth/session'
import { HeaderNav } from './header-nav'
import { signOutAction } from '@/app/login/actions'

export async function SiteHeader() {
  const user = await getCurrentUser()
  return <HeaderNav user={user ? { name: user.name, email: user.email, role: user.role, authMethod: user.authMethod } : null} signOutAction={signOutAction} />
}
