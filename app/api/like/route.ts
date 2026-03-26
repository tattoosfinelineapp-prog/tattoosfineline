import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { photo_id, tipo, action } = await req.json()
  if (!photo_id || !tipo) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const uid = session.user.id

  if (action === 'unlike') {
    await supabase.from('likes').delete().eq('user_id', uid).eq('photo_id', photo_id).eq('tipo', tipo)
    return NextResponse.json({ ok: true })
  }

  // Check if already liked with this type
  const { data: existing } = await supabase.from('likes')
    .select('id').eq('user_id', uid).eq('photo_id', photo_id).eq('tipo', tipo).single()

  if (existing) {
    await supabase.from('likes').delete().eq('id', existing.id)
    return NextResponse.json({ ok: true, action: 'removed' })
  }

  await supabase.from('likes').insert({ user_id: uid, photo_id, tipo })

  // Notify tatuador for 'want' type
  if (tipo === 'want') {
    try {
      const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data: photo } = await admin.from('photos').select('tatuador_id').eq('id', photo_id).single()
      if (photo?.tatuador_id && photo.tatuador_id !== uid) {
        const { data: viewer } = await admin.from('users').select('nombre, username, ciudad').eq('id', uid).single()
        const nombre = viewer?.nombre || viewer?.username || 'Alguien'
        const ciudad = viewer?.ciudad ? ` de ${viewer.ciudad}` : ''
        await admin.from('notifications').insert({
          user_id: photo.tatuador_id,
          type: 'want_foto',
          message: `${nombre}${ciudad} quiere este tatuaje`,
          from_user_id: uid,
          photo_id,
        })
      }
    } catch {}
  }

  return NextResponse.json({ ok: true, action: 'added' })
}
