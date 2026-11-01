'use client'

/**
 * Client boundary for LeafyGreen components so Server Components can render them.
 * LeafyGreen packages rely on React context and are not RSC-safe on their own.
 */
import LGButton from '@leafygreen-ui/button'
import { SegmentedControlOption as LGSegmentedControlOption } from '@leafygreen-ui/segmented-control'
import { Cell as LGCell, HeaderCell as LGHeaderCell, Row as LGRow } from '@leafygreen-ui/table'
import type { ButtonHTMLAttributes, ComponentType, HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'

/*
 * LeafyGreen's polymorphic component typings declare a (props, ref) call
 * signature that React 19's JSX types reject. These casts keep runtime
 * behaviour identical while exposing the documented props.
 */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'primaryOutline' | 'danger' | 'dangerOutline' | 'baseGreen'
  size?: 'xsmall' | 'small' | 'default' | 'large'
  leftGlyph?: React.ReactElement
  rightGlyph?: React.ReactElement
  isLoading?: boolean
  loadingText?: string
  href?: string
  as?: unknown
  target?: string
  rel?: string
  darkMode?: boolean
  children?: ReactNode
}
export const Button = LGButton as unknown as ComponentType<ButtonProps>
export const SegmentedControlOption = LGSegmentedControlOption as unknown as ComponentType<
  HTMLAttributes<HTMLButtonElement> & { value: string; disabled?: boolean; glyph?: React.ReactElement; children?: ReactNode }
>
export const HeaderCell = LGHeaderCell as unknown as ComponentType<ThHTMLAttributes<HTMLTableCellElement>>
export const Row = LGRow as unknown as ComponentType<HTMLAttributes<HTMLTableRowElement>>
export const Cell = LGCell as unknown as ComponentType<TdHTMLAttributes<HTMLTableCellElement>>

export { default as Badge } from '@leafygreen-ui/badge'
export { default as Banner } from '@leafygreen-ui/banner'
export { SegmentedControl } from '@leafygreen-ui/segmented-control'
export { HeaderRow, Table, TableBody, TableHead } from '@leafygreen-ui/table'
export { default as Callout } from '@leafygreen-ui/callout'
export { default as Card } from '@leafygreen-ui/card'
export { default as Icon } from '@leafygreen-ui/icon'
export { Body, Description, H1, H2, H3, InlineCode, Label, Link as LGLink, Overline, Subtitle } from '@leafygreen-ui/typography'
