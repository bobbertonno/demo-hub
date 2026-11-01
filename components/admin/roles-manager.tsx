'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/lg'
import { apiFetch, describeError } from '@/lib/client/api'
import { SelectField, TextField } from './fields'

type Role = 'viewer' | 'contributor' | 'admin'
const ROLES = ['viewer', 'contributor', 'admin'] as const

export function RolesManager({ roles, writable }: { roles: { email: string; role: Role; updatedAt: string; updatedBy: string }[]; writable: boolean }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('viewer')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function assign(targetEmail: string, targetRole: Role) {
    setBusy(true)
    setMessage(null)
    try {
      await apiFetch('/api/roles', { method: 'PUT', body: JSON.stringify({ email: targetEmail, role: targetRole }) })
      setMessage({ ok: true, text: `${targetEmail} is now ${targetRole}.` })
      setEmail('')
      router.refresh()
    } catch (err) {
      setMessage({ ok: false, text: describeError(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form
        className="grid items-end gap-4 md:grid-cols-[1fr_200px_auto]"
        onSubmit={(e) => {
          e.preventDefault()
          if (email) assign(email.trim(), role)
        }}
      >
        <TextField label="Corporate email" type="email" required value={email} onChange={setEmail} />
        <SelectField label="Role" value={role} options={ROLES} onChange={setRole} />
        <Button type="submit" variant="primary" disabled={!writable || busy || !email}>
          Assign role
        </Button>
      </form>
      {message ? (
        <p role={message.ok ? 'status' : 'alert'} className={`text-sm ${message.ok ? 'text-accent' : 'text-red-600'}`}>
          {message.text}
        </p>
      ) : null}
      {roles.length === 0 ? (
        <p className="text-sm text-muted-foreground">{writable ? 'No explicit role assignments. Authenticated users default to viewer; ADMIN_EMAILS bootstraps admins.' : 'Role assignments are stored in MongoDB.'}</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {roles.map((r) => (
            <li key={r.email} className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-foreground">{r.email}</p>
                <p className="text-xs text-muted-foreground">
                  Updated by {r.updatedBy} · {new Date(r.updatedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {ROLES.map((option) => (
                  <Button key={option} size="xsmall" variant={option === r.role ? 'primary' : 'default'} disabled={!writable || busy || option === r.role} onClick={() => assign(r.email, option)}>
                    {option}
                  </Button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
