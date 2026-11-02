import Link from 'next/link'
import { Lightbulb, Settings } from 'lucide-react'

export function CustomizeBanner() {
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-gradient-to-r from-[#E3FCF7] to-[#C0FAE6]/70 p-5 text-forest sm:flex-row sm:items-center dark:from-forest dark:to-forest dark:text-white">
      <Lightbulb className="size-8 shrink-0 text-leaf-dark dark:text-leaf" aria-hidden />
      <div className="flex-1">
        <h2 className="text-lg font-semibold">Want to customize a demo?</h2>
        <p className="text-sm opacity-85">
          Use the configurable mode to connect your Atlas cluster, load your own data and apply the customer&apos;s look and feel.
        </p>
      </div>
      <Link
        href="/about"
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-leaf-dark bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
      >
        <Settings className="size-4" aria-hidden />
        Configure a custom demo
      </Link>
    </section>
  )
}
