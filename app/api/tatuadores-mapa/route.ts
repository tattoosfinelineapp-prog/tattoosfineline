import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''

  let query = admin
    .from('users')
    .select('id, nombre, username, avatar, ciudad, tipo_cuenta, lat, lng, precio_desde')
    .in('tipo_cuenta', ['tatuador', 'estudio'])
    .not('lat', 'is', null)
    .not('lng', 'is', null)

  if (q) {
    query = query.or(`nombre.ilike.%${q}%,username.ilike.%${q}%,ciudad.ilike.%${q}%`)
  }

  const { data } = await query.order('followers_count', { ascending: false }).limit(200)

  // Fetch 3 photos per tatuador
  const withPhotos = await Promise.all(
    (data ?? []).map(async (u: { id: string; [key: string]: unknown }) => {
      const { data: photos } = await admin
        .from('photos')
        .select('id, url')
        .eq('tatuador_id', u.id)
        .eq('status', 'published')
        .order('likes', { ascending: false })
        .limit(3)
      return { ...u, photos: photos ?? [] }
    })
  )

  return NextResponse.json({ tatuadores: withPhotos })
}
