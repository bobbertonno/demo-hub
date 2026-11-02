import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, Play } from 'lucide-react'
import type { DemoRecord } from '@/lib/schemas/manifest'

const ILLUSTRATIONS: Record<string, { src: string; dark?: boolean }> = {
  'atlas-document-hub': { src: '/images/home/demo-document-hub.png' },
  'intelligent-workflow-automation': { src: '/images/home/demo-workflow.png' },
  'digital-euro-single-view-audit': { src: '/images/home/demo-digital-euro.png' },
  'atlas-infinite-scale-without-limits': { src: '/images/home/demo-atlas-infinite.png', dark: true },
}

const FALLBACK = { src: '/images/home/demo-document-hub.png' }

export const NEW_DEMO_SLUGS = new Set(['atlas-infinite-scale-without-limits'])

export function ShowcaseCard({ demo }: { demo: DemoRecord }) {
  const art = ILLUSTRATIONS[demo.slug] ?? FALLBACK
  const isNew = NEW_DEMO_SLUGS.has(demo.slug)
  const detailHref = `/demos/${demo.slug}`

  return (
    <article
      data-testid="demo-card"
      data-slug={demo.slug}
      className={`flex h-full flex-col rounded-xl border bg-background p-3 shadow-sm transition-shadow hover:shadow-md ${
        isNew ? 'border-leaf ring-1 ring-leaf/60' : ''
      }`}
    >
      <div className={`relative aspect-[16/7] overflow-hidden rounded-lg ${art.dark ? 'bg-forest' : 'bg-[#E3FCF7] dark:bg-forest'}`}>
        <Image src={art.src} alt="" fill sizes="(min-width: 1280px) 20vw, (min-width: 640px) 45vw, 100vw" className="object-cover" />
        {isNew && <span className="absolute right-2 top-2 rounded-md bg-leaf px-2 py-0.5 text-xs font-semibold text-forest">New</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-2 pb-1 pt-4">
        <span className="self-start rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-foreground/80">
          {demo.category ?? demo.industry}
        </span>
        <h3 className="text-lg font-semibold leading-snug">{demo.title}</h3>
        <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">{demo.tagline ?? demo.summary}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <Link
            href={detailHref}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-leaf px-3 py-2 text-sm font-semibold text-forest transition-colors hover:bg-[#71F6BA]"
          >
            <Play className="size-3.5 fill-current" aria-hidden />
            Launch demo
            <span className="sr-only">: {demo.title}</span>
          </Link>
          {demo.repository ? (
            <a
              href={demo.repository}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-surface"
            >
              Details
              <ExternalLink className="size-3.5" aria-hidden />
              <span className="sr-only">(opens repository in a new tab)</span>
            </a>
          ) : (
            <Link
              href={detailHref}
              className="inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-surface"
            >
              Details
              <span className="sr-only">: {demo.title}</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
