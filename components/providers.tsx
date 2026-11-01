'use client'

import LeafyGreenProvider from '@leafygreen-ui/leafygreen-provider'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

type ThemeContextValue = { darkMode: boolean; toggle: () => void }
const ThemeContext = createContext<ThemeContextValue>({ darkMode: false, toggle: () => {} })

export function useHubTheme() {
  return useContext(ThemeContext)
}

const STORAGE_KEY = 'demo-hub-theme'

export function Providers({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // UI display preference only; no catalog data is stored client-side.
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const initial = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(initial)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light'
  }, [darkMode])

  const toggle = useCallback(() => {
    setDarkMode((prev) => {
      window.localStorage.setItem(STORAGE_KEY, prev ? 'light' : 'dark')
      return !prev
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ darkMode, toggle }}>
      <LeafyGreenProvider darkMode={darkMode} baseFontSize={14}>
        {children}
      </LeafyGreenProvider>
    </ThemeContext.Provider>
  )
}
