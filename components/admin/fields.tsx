'use client'

import LGTextArea from '@leafygreen-ui/text-area'
import LGTextInput from '@leafygreen-ui/text-input'
import LGToggle from '@leafygreen-ui/toggle'
import { Option as LGOption, Select as LGSelect } from '@leafygreen-ui/select'
import type { ComponentType, ReactNode } from 'react'

type AnyProps = Record<string, unknown> & { children?: ReactNode }
const TextInputBase = LGTextInput as unknown as ComponentType<AnyProps>
const TextAreaBase = LGTextArea as unknown as ComponentType<AnyProps>
const ToggleBase = LGToggle as unknown as ComponentType<AnyProps>
const SelectBase = LGSelect as unknown as ComponentType<AnyProps>
const OptionBase = LGOption as unknown as ComponentType<AnyProps>

export function TextField({
  label,
  value,
  onChange,
  description,
  placeholder,
  type = 'text',
  disabled,
  required,
  errorMessage,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  description?: string
  placeholder?: string
  type?: 'text' | 'email' | 'url' | 'search'
  disabled?: boolean
  required?: boolean
  errorMessage?: string
}) {
  return (
    <TextInputBase
      label={label}
      description={description}
      placeholder={placeholder}
      type={type}
      value={value}
      disabled={disabled}
      optional={!required}
      state={errorMessage ? 'error' : 'none'}
      errorMessage={errorMessage}
      onChange={(e: { target: { value: string } }) => onChange(e.target.value)}
    />
  )
}

export function TextAreaField({
  label,
  value,
  onChange,
  description,
  rows = 4,
  mono,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  description?: string
  rows?: number
  mono?: boolean
}) {
  return (
    <TextAreaBase
      label={label}
      description={description}
      value={value}
      rows={rows}
      className={mono ? 'font-mono text-sm' : undefined}
      onChange={(e: { target: { value: string } }) => onChange(e.target.value)}
    />
  )
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  description,
}: {
  label: string
  value: T
  options: readonly T[] | { value: T; label: string }[]
  onChange: (value: T) => void
  description?: string
}) {
  const normalized = (options as readonly (T | { value: T; label: string })[]).map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
  return (
    <SelectBase label={label} description={description} value={value} allowDeselect={false} onChange={(v: string) => onChange(v as T)}>
      {normalized.map((o) => (
        <OptionBase key={o.value} value={o.value}>
          {o.label}
        </OptionBase>
      ))}
    </SelectBase>
  )
}

export function ToggleField({ label, checked, onChange, description }: { label: string; checked: boolean; onChange: (checked: boolean) => void; description?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <ToggleBase aria-label={label} size="small" checked={checked} onChange={(next: boolean) => onChange(next)} />
    </div>
  )
}

/** Comma-separated list editor for short string arrays (tags, use cases). */
export function ListField({ label, value, onChange, description }: { label: string; value: string[]; onChange: (value: string[]) => void; description?: string }) {
  return (
    <TextField
      label={label}
      description={description ?? 'Comma-separated'}
      value={value.join(', ')}
      onChange={(raw) =>
        onChange(
          raw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        )
      }
    />
  )
}

export function CheckboxGroup<T extends string>({ legend, options, value, onChange }: { legend: string; options: readonly T[]; value: T[]; onChange: (value: T[]) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-semibold text-foreground">{legend}</legend>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {options.map((o) => (
          <label key={o} className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="size-4 accent-[var(--lg-green-dark2)]"
              checked={value.includes(o)}
              onChange={(e) => onChange(e.target.checked ? [...value, o] : value.filter((v) => v !== o))}
            />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
