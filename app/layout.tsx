import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Source_Code_Pro } from 'next/font/google'
import { Providers } from '@/components/providers'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { EnvironmentBanner } from '@/components/layout/environment-banner'
import './globals.css'

const sans = Inter({ subsets: ['latin'], variable: '--font-hub-sans', display: 'swap' })
const mono = Source_Code_Pro({ subsets: ['latin'], variable: '--font-hub-mono', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'MongoDB Demo Hub – Solutions Architect Edition', template: '%s · MongoDB Demo Hub' },
  description: 'Internal catalog of MongoDB Solutions Architect demos: documentation, architectures, capability mapping and verified setup guides.',
  robots: { index: false, follow: false },
  icons: { icon: '/icon.svg' },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#001E2B' },
    { media: '(prefers-color-scheme: dark)', color: '#001E2B' },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-black">
            Skip to content
          </a>
          <div className="flex min-h-screen flex-col">
            <EnvironmentBanner />
            <SiteHeader />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </div>
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
