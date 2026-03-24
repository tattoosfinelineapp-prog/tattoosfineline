import { getPhotosPage } from '@/lib/queries'
import GaleriaInfinita from '@/components/GaleriaInfinita'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: { q?: string }
}

export default async function GaleriaPage({ searchParams }: Props) {
  const query = searchParams.q?.trim() ?? ''
  const { photos, total } = await getPhotosPage(0, 24, query || undefined)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24">
      <GaleriaInfinita initialPhotos={photos} initialTotal={total} query={query} />
    </div>
  )
}
