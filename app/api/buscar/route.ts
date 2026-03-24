import { NextRequest, NextResponse } from 'next/server'
import { getPhotosPage, searchUsers, searchCarpetas } from '@/lib/queries'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  if (!q.trim()) {
    return NextResponse.json({ fotos: [], tatuadores: [], estudios: [], carpetas: [] })
  }

  const [{ photos: fotos }, tatuadores, estudios, carpetas] = await Promise.all([
    getPhotosPage(0, 20, q),
    searchUsers(q, 'tatuador'),
    searchUsers(q, 'estudio'),
    searchCarpetas(q),
  ])

  return NextResponse.json({ fotos, tatuadores, estudios, carpetas })
}
