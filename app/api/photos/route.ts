import { NextResponse } from 'next/server'
import { getPhotosPage } from '@/lib/queries'
import type { SortOrder } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const page   = parseInt(searchParams.get('page') ?? '0', 10)
  const limit  = parseInt(searchParams.get('limit') ?? '24', 10)
  const query  = searchParams.get('q') ?? ''
  const orden  = (searchParams.get('orden') as SortOrder) || undefined
  const ciudad = searchParams.get('ciudad') || undefined

  const result = await getPhotosPage(page, Math.min(limit, 48), query || undefined, orden, ciudad)
  return NextResponse.json(result)
}
