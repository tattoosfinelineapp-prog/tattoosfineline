import ExplorarClient from '@/components/ExplorarClient'
import { getPhotos } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export default async function ExplorarPage() {
  const tattoos = await getPhotos()
  return <ExplorarClient tattoos={tattoos} />
}
