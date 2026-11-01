import type { Metadata } from 'next'
import { ArchitectureGallery, type GalleryDiagram } from '@/components/architectures/architecture-gallery'
import { Container, EmptyState, PageHero } from '@/components/shared/page'
import { requireBrowseAccess } from '@/lib/auth/session'
import { getVisibleDemos } from '@/lib/catalog/visible'

export const metadata: Metadata = { title: 'Architecture gallery' }

export default async function ArchitecturesPage() {
  await requireBrowseAccess('/architectures')
  const { data: demos } = await getVisibleDemos()
  const diagrams: GalleryDiagram[] = demos.flatMap((demo) =>
    demo.architecture.diagrams.map((d) => ({
      key: `${demo.slug}:${d.id}`,
      demoSlug: demo.slug,
      demoTitle: demo.title,
      title: d.title,
      description: d.description,
      mermaid: d.mermaid,
      illustrative: d.illustrative,
      provenance: d.provenance,
    })),
  )

  return (
    <>
      <PageHero
        eyebrow="Architecture gallery"
        title="Reference architectures behind every demo"
        description="Mermaid diagrams with explanations. Diagrams labeled illustrative describe the intended design and are not sourced from the repository until synchronized."
      />
      <Container className="py-12">
        {diagrams.length ? <ArchitectureGallery diagrams={diagrams} /> : <EmptyState title="No architecture diagrams yet" />}
      </Container>
    </>
  )
}
