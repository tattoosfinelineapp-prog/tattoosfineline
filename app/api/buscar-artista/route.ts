import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { descripcion, zona, ciudad } = await req.json()

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Extract keywords from description
  const keywords = (descripcion ?? '')
    .toLowerCase()
    .replace(/[^a-záéíóúñü\s]/g, '')
    .split(/\s+/)
    .filter((w: string) => w.length > 3)
    .slice(0, 5)

  // Find tatuadores in the city with matching tags
  let q = admin
    .from('users')
    .select('id, nombre, username, avatar, ciudad')
    .in('tipo_cuenta', ['tatuador', 'estudio'])
    .order('followers_count', { ascending: false })
    .limit(20)

  if (ciudad) {
    q = q.ilike('ciudad', `%${ciudad}%`)
  }

  const { data: users } = await q
  if (!users || !users.length) {
    return NextResponse.json({ resultados: [] })
  }

  // For each user, find a matching photo
  const resultados = await Promise.all(
    users.map(async (u: { id: string; nombre: string | null; username: string | null; avatar: string | null; ciudad: string | null }) => {
      // Try to find photo matching keywords or zona
      let photoQ = admin
        .from('photos')
        .select('url, tags')
        .eq('tatuador_id', u.id)
        .eq('status', 'published')
        .limit(1)

      if (zona) {
        photoQ = photoQ.ilike('zona', `%${zona}%`)
      }

      const { data: photos } = await photoQ
      const photo = photos?.[0]

      return {
        ...u,
        foto_url: photo?.url ?? null,
        foto_tags: photo?.tags ?? null,
        score: photo ? 1 : 0,
      }
    })
  )

  // Sort by those with matching photos first, limit to 3
  const sorted = resultados
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ score, ...rest }) => rest)

  return NextResponse.json({ resultados: sorted })
}
