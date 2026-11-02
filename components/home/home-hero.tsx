import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, CirclePlay } from 'lucide-react'

export function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden bg-forest text-white lg:rounded-br-3xl">
      <Image
        src="/images/home/hero-shapes.png"
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 75vw, 100vw"
        className="-z-10 object-cover object-right opacity-60 md:opacity-100"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-forest via-forest/85 to-transparent" />
      <div className="flex flex-col items-start gap-4 px-6 py-12 sm:px-10 md:py-14">
        <span className="rounded-md bg-leaf px-2.5 py-1 text-xs font-semibold text-forest">Demo Hub</span>
        <h1 className="text-balance text-4xl font-semibold leading-tight md:text-5xl">MongoDB Demo Hub</h1>
        <p className="max-w-xl text-pretty text-base leading-relaxed text-white/85 md:text-lg">
          Interactive demos, real-world scenarios and reference architectures to explore MongoDB Atlas solutions.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link
            href="#demos"
            className="inline-flex items-center gap-2 rounded-lg bg-leaf px-5 py-3 text-sm font-semibold text-forest transition-colors hover:bg-[#71F6BA]"
          >
            <CirclePlay className="size-4" aria-hidden />
            Explore the demos
          </Link>
          <Link
            href="/getting-started"
            className="inline-flex items-center gap-2 rounded-lg border border-white/70 px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
          >
            <BookOpen className="size-4" aria-hidden />
            Demo Hub guide
          </Link>
        </div>
      </div>
    </section>
  )
}
