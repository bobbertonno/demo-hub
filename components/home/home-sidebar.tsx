import Link from 'next/link'
import { ArrowRight, BookOpen, ChevronRight, ExternalLink, Infinity as InfinityIcon, Layers, Rocket, Scale, Target } from 'lucide-react'

const QUICK_START = [
  { href: '/architectures', label: 'Explore the architectures', icon: Layers },
  { href: '/capabilities', label: 'Pick a use case', icon: Target },
  { href: '/demos/atlas-infinite-scale-without-limits', label: 'Compare Atlas Core vs Infinite', icon: Scale },
  { href: '/getting-started', label: 'Demo guide', icon: BookOpen },
]

const RESOURCES = [
  { href: 'https://www.mongodb.com/docs/atlas/', label: 'Atlas documentation' },
  { href: 'https://www.mongodb.com/docs/atlas/import/', label: 'Migration best practices' },
  { href: 'https://www.mongodb.com/resources', label: 'Webinars and presentations' },
]

export function HomeSidebar() {
  return (
    <aside aria-label="Shortcuts" className="flex flex-col gap-5">
      <section className="rounded-xl border bg-background p-5 shadow-sm">
        <h2 className="flex items-center gap-2.5 text-lg font-semibold">
          <Rocket className="size-5 text-leaf-dark dark:text-leaf" aria-hidden />
          Quick start
        </h2>
        <ul className="mt-3 divide-y">
          {QUICK_START.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link href={href} className="group flex items-center gap-3 py-3 text-sm transition-colors hover:text-accent">
                <Icon className="size-5 shrink-0 text-leaf-dark dark:text-leaf" aria-hidden />
                <span className="flex-1">{label}</span>
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex gap-4 rounded-xl bg-gradient-to-br from-[#E3FCF7] to-[#C0FAE6] p-5 text-forest dark:from-forest dark:to-forest dark:text-white">
        <InfinityIcon className="mt-0.5 size-7 shrink-0 text-leaf-dark dark:text-leaf" aria-hidden />
        <div>
          <h2 className="text-lg font-semibold">Atlas Infinite</h2>
          <p className="mt-1 text-sm leading-relaxed opacity-85">
            The new Atlas architecture to scale data and workloads without limits.
          </p>
          <Link
            href="/demos/atlas-infinite-scale-without-limits"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-leaf-dark hover:underline dark:text-leaf"
          >
            Learn more
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      <section className="rounded-xl border bg-background p-5 shadow-sm">
        <h2 className="flex items-center gap-2.5 text-lg font-semibold">
          <Layers className="size-5 text-leaf-dark dark:text-leaf" aria-hidden />
          Useful resources
        </h2>
        <ul className="mt-3 divide-y">
          {RESOURCES.map(({ href, label }) => (
            <li key={href}>
              <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-3 text-sm transition-colors hover:text-accent">
                <span className="flex-1">{label}</span>
                <ExternalLink className="size-4 text-muted-foreground" aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}
