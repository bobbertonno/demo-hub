'use server'

import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { DEV_PROVIDER_ID, OIDC_PROVIDER_ID, isAuthAvailable, signIn, signOut } from '@/lib/auth/auth'
import { DEV_ACCOUNTS } from '@/lib/auth/roles'
import { isDevAuthEnabled, isSsoConfigured } from '@/lib/config/env'

function safeCallback(value: FormDataEntryValue | null): string {
  const v = typeof value === 'string' ? value : '/'
  return v.startsWith('/') && !v.startsWith('//') ? v : '/'
}

export async function ssoSignInAction(formData: FormData) {
  if (!isSsoConfigured()) redirect('/login?error=NotConfigured')
  await signIn(OIDC_PROVIDER_ID, { redirectTo: safeCallback(formData.get('callbackUrl')) })
}

export async function devSignInAction(formData: FormData) {
  if (!isDevAuthEnabled()) redirect('/login?error=DevDisabled')
  const email = z
    .string()
    .email()
    .refine((e) => DEV_ACCOUNTS.some((a) => a.email === e))
    .safeParse(formData.get('email'))
  if (!email.success) redirect('/login?error=InvalidAccount')
  try {
    await signIn(DEV_PROVIDER_ID, { email: email.data, redirectTo: safeCallback(formData.get('callbackUrl')) })
  } catch (err) {
    if (err instanceof AuthError) redirect('/login?error=AccessDenied')
    throw err
  }
}

export async function signOutAction() {
  if (!isAuthAvailable()) redirect('/')
  await signOut({ redirectTo: '/' })
}
