import { NextResponse } from 'next/server'
import { getPhotosPage } from '@/lib/queries'
import type { SortOrder } from '@/lib/queries'
import { expandQuery } from '@/lib/tagSynonyms'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const page   = parseInt(searchParams.get('page') ?? '0', 10)
  const limit  = parseInt(searchParams.get('limit') ?? '24', 10)
  const query  = searchParams.get('q') ?? ''
  const orden  = (searchParams.get('orden') as SortOrder) || undefined
  const ciudad = searchParams.get('ciudad') || undefined

  if (!query) {
    const result = await getPhotosPage(page, Math.min(limit, 48), undefined, orden, ciudad)
    return NextResponse.json(result)
  }

  // Expand query with synonyms (mariposa → butterfly, etc.)
  const terms = expandQuery(query)

  // Search all synonym terms and merge
  const results = await Promise.all(
    terms.map(term => getPhotosPage(page, Math.min(limit, 48), term, orden, ciudad))
  )

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

  // Use the max total from any term result
  const maxTotal = Math.max(...results.map(r => r.total), 0)

  return NextResponse.json({
    photos: merged.slice(0, Math.min(limit, 48)),
    total: maxTotal,
  })
}
