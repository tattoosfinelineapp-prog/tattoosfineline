import { NextRequest, NextResponse } from 'next/server'
import { getPhotosPage, searchUsers, searchCarpetas } from '@/lib/queries'
import type { SortOrder } from '@/lib/queries'
import { expandQuery } from '@/lib/tagSynonyms'

export async function GET(req: NextRequest) {
  const q      = req.nextUrl.searchParams.get('q') ?? ''
  const orden  = (req.nextUrl.searchParams.get('orden') as SortOrder) || undefined
  const ciudad = req.nextUrl.searchParams.get('ciudad') || undefined

  if (!q.trim()) {
    return NextResponse.json({ fotos: [], tatuadores: [], estudios: [], carpetas: [] })
  }

  const terms = expandQuery(q)
  const primaryQuery = terms[0]

  const [photoResults, tatuadores, estudios, carpetas] = await Promise.all([
    Promise.all(terms.map(term => getPhotosPage(0, 20, term, orden, ciudad))).then(results => {
      const seen = new Set<string>()
      const merged = []
      for (const { photos } of results) {
        for (const photo of photos) {
          if (!seen.has(photo.id)) {
            seen.add(photo.id)
            merged.push(photo)
          }
        }
      }
      return { photos: merged.slice(0, 20) }
    }),
    searchUsers(primaryQuery, 'tatuador'),
    searchUsers(primaryQuery, 'estudio'),
    searchCarpetas(primaryQuery),
  ])

  return NextResponse.json({
    fotos: photoResults.photos,
    tatuadores,
    estudios,
    carpetas,
  })
}
