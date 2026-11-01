'use client'

import { Tab, Tabs as LGTabs } from '@leafygreen-ui/tabs'
import { type ComponentProps, useSyncExternalStore } from 'react'

const subscribe = () => () => {}

function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}

/**
 * LeafyGreen Tabs allocates element ids with a non-deterministic allocator,
 * which causes SSR hydration mismatches. Render after hydration, reserving the tablist height.
 */
function HydratedTabs(props: ComponentProps<typeof LGTabs>) {
  const hydrated = useHydrated()
  if (!hydrated) {
    return <div aria-hidden="true" className="min-h-12 border-b border-[var(--hub-border,rgba(128,128,128,0.25))]" />
  }
  return <LGTabs {...props} />
}

export const Tabs = HydratedTabs as unknown as typeof LGTabs

export { Tab }
