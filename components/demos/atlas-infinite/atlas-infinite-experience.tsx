'use client'

import Badge from '@leafygreen-ui/badge'
import Modal from '@leafygreen-ui/modal'
import { Tab, Tabs } from '@/components/hub-tabs'
import { useId, useState } from 'react'
import type { FactEntry } from '@/lib/schemas/manifest'
import { AtlasCoreDiagram, AtlasInfiniteDiagram } from './diagrams'
import { MigrationSimulator } from './migration-simulator'

function Slider({ label, value, onChange, hint }: { label: string; value: number; onChange: (v: number) => void; hint: string }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        <span className="tabular-nums text-muted-foreground">{value}×</span>
      </div>
      <input id={id} type="range" min={1} max={10} value={value} onChange={(e) => onChange(Number(e.target.value))} className="accent-[#00A35C]" aria-describedby={`${id}-hint`} />
      <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

const SLIDES = [
  { title: 'Conventional sharded Atlas Core', body: 'Each shard couples compute and storage. Growth means adding shards and rebalancing data. This is one illustrative configuration.', diagram: 'core' },
  { title: 'Atlas Infinite: separated compute and storage', body: 'In this educational scenario two compute nodes serve the workload while storage grows independently.', diagram: 'infinite' },
  { title: 'Operational implications', body: 'Discuss capacity planning, rebalancing, cost and operational effort with verified documentation — not assumptions from this diagram.', diagram: 'both' },
] as const

export function AtlasInfiniteExperience({ facts }: { facts: FactEntry[] }) {
  const [data, setData] = useState(3)
  const [load, setLoad] = useState(2)
  const [tab, setTab] = useState(0)
  const [presenting, setPresenting] = useState(false)
  const [slide, setSlide] = useState(0)

  return (
    <div className="flex flex-col gap-6" data-testid="atlas-infinite-experience">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Interactive educational model. Sliders change illustrative visuals only — they are not measured results.</p>
        <button type="button" onClick={() => { setSlide(0); setPresenting(true) }} className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-[#00684A]">
          Webinar presentation mode
        </button>
      </div>

      <Tabs aria-label="Atlas Infinite explorer" value={tab} onValueChange={setTab}>
        <Tab name="Architecture evolution">
          <div className="grid gap-8 pt-6 lg:grid-cols-[18rem_1fr]">
            <div className="flex flex-col gap-6">
              <Slider label="Data growth" value={data} onChange={setData} hint="Illustrative multiplier of stored data." />
              <Slider label="Application load" value={load} onChange={setLoad} hint="Illustrative multiplier of request volume." />
              <Badge variant="lightgray">Illustrative assumption</Badge>
            </div>
            <div className="grid gap-8 xl:grid-cols-2">
              <div className="rounded-xl border p-5">
                <h4 className="mb-4 font-semibold">Atlas Core (sharded)</h4>
                <AtlasCoreDiagram loadFactor={load} />
              </div>
              <div className="rounded-xl border p-5">
                <h4 className="mb-4 font-semibold">Atlas Infinite</h4>
                <AtlasInfiniteDiagram storageFill={data / 10} />
              </div>
            </div>
          </div>
        </Tab>
        <Tab name="Facts & assumptions">
          <div className="pt-6">
            <p className="mb-4 text-sm text-muted-foreground">Versioned, admin-editable metadata. Unverified entries must not be presented as product facts.</p>
            <ul className="grid gap-3 md:grid-cols-2" data-testid="facts-list">
              {facts.map((f) => (
                <li key={f.key} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{f.label}</p>
                    <Badge variant={f.verificationStatus === 'verified' ? 'green' : f.verificationStatus === 'outdated' ? 'red' : 'yellow'}>{f.verificationStatus}</Badge>
                    <Badge variant="lightgray">{f.kind}</Badge>
                    <span className="text-xs text-muted-foreground">v{f.version}</span>
                  </div>
                  <p className="mt-2 text-sm">{f.value}</p>
                  {f.source && (
                    <a href={f.source} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-accent underline">
                      Source
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </Tab>
        <Tab name="Guided migration center">
          <div className="pt-6">
            <MigrationSimulator />
          </div>
        </Tab>
      </Tabs>

      <Modal open={presenting} setOpen={setPresenting} size="large">
        <div className="flex min-h-[70vh] flex-col gap-6" onKeyDown={(e) => { if (e.key === 'ArrowRight') setSlide((s) => Math.min(s + 1, SLIDES.length - 1)); if (e.key === 'ArrowLeft') setSlide((s) => Math.max(s - 1, 0)) }}>
          <p className="text-sm text-muted-foreground">Slide {slide + 1} of {SLIDES.length} · Use arrow keys</p>
          <h2 className="text-3xl font-semibold">{SLIDES[slide].title}</h2>
          <p className="max-w-3xl text-lg leading-relaxed">{SLIDES[slide].body}</p>
          <div className={`grid flex-1 gap-8 ${SLIDES[slide].diagram === 'both' ? 'lg:grid-cols-2' : ''}`}>
            {SLIDES[slide].diagram !== 'infinite' && <AtlasCoreDiagram large />}
            {SLIDES[slide].diagram !== 'core' && <AtlasInfiniteDiagram large />}
          </div>
          <div className="flex justify-between">
            <button type="button" className="rounded-md border px-4 py-2" disabled={slide === 0} onClick={() => setSlide((s) => s - 1)}>Previous</button>
            <button type="button" className="rounded-md bg-forest px-4 py-2 text-white disabled:opacity-50" disabled={slide === SLIDES.length - 1} onClick={() => setSlide((s) => s + 1)}>Next</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
