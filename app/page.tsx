import GaleriaHome from '@/components/GaleriaHome'
import LandingOverlay from '@/components/LandingOverlay'
import { getPhotos } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const tattoos = await getPhotos()

  return (
    <>
      <LandingOverlay totalFotos={tattoos.length} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <GaleriaHome tattoos={tattoos} />
      </div>
    </>
  )
}
