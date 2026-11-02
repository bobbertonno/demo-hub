import { CustomizeBanner } from '@/components/home/customize-banner'
import { DemoShowcase } from '@/components/home/demo-showcase'
import { HomeHero } from '@/components/home/home-hero'
import { HomeSidebar } from '@/components/home/home-sidebar'
import { requireBrowseAccess } from '@/lib/auth/session'
import { getVisibleDemos } from '@/lib/catalog/visible'

export default async function HomePage() {
  await requireBrowseAccess('/')
  const { data: demos, degraded } = await getVisibleDemos()
  const featured = demos.filter((d) => d.featured)
  const showcase = featured.length ? featured : demos
  const unavailableReason = showcase.length ? undefined : degraded

  return (
    <div className="flex flex-col lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col">
        <HomeHero />
        <div className="flex flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
          <DemoShowcase demos={showcase} unavailableReason={unavailableReason} />
          <CustomizeBanner />
        </div>
      </div>
      <div className="border-t bg-surface/60 px-4 py-8 sm:px-6 lg:w-80 lg:shrink-0 lg:border-l lg:border-t-0 lg:px-6 xl:w-96">
        <HomeSidebar />
      </div>
    </div>
  )
}
