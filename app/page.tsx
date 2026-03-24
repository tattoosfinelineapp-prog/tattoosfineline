import GaleriaHome from '@/components/GaleriaHome'
import { getPhotos } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const tattoos = await getPhotos()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-2">
          Galería fine line
        </h1>
        <p className="text-gray-400 text-base">
          {tattoos.length} tatuajes · actualizado hoy
        </p>
      </div>

      <GaleriaHome tattoos={tattoos} />
    </div>
  )
}
