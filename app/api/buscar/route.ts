import { NextRequest, NextResponse } from 'next/server'
import { getPhotosPage, searchUsers, searchCarpetas } from '@/lib/queries'
import { expandQuery } from '@/lib/tagSynonyms'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  if (!q.trim()) {
    return NextResponse.json({ fotos: [], tatuadores: [], estudios: [], carpetas: [] })
  }

  // Expand query with synonyms (e.g. "flower" → also searches "floral", "flores")
  const terms = expandQuery(q)
  const primaryQuery = terms[0]

  // Run parallel searches: use all synonym terms for photos, primary for users/carpetas
  const [photoResults, tatuadores, estudios, carpetas] = await Promise.all([
    // For photos: search all synonym terms and merge results
    Promise.all(terms.map(term => getPhotosPage(0, 20, term))).then(results => {
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
