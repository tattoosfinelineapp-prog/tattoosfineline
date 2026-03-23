import ExplorarClient from '@/components/ExplorarClient'
import { getPhotos } from '@/lib/queries'
import { tattoosSample } from '@/lib/data'

export const revalidate = 60

export default async function ExplorarPage() {
  const photosDB = await getPhotos()
  const tattoos = photosDB.length > 0 ? photosDB : tattoosSample

  return <ExplorarClient tattoos={tattoos} />
}
