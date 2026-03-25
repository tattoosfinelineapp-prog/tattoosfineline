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

  const { photo_id, carpeta_id, action } = await req.json()
  if (!photo_id) return NextResponse.json({ error: 'photo_id required' }, { status: 400 })

  const uid = session.user.id

  if (action === 'unsave') {
    await supabase.from('saves').delete().eq('user_id', uid).eq('photo_id', photo_id)
    return NextResponse.json({ ok: true })
  }

  // Save
  await supabase.from('saves').insert({
    user_id: uid,
    photo_id,
    carpeta_id: carpeta_id ?? null,
  })

  // Notify the photo owner (if different from saver)
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: photo } = await admin
      .from('photos')
      .select('tatuador_id')
      .eq('id', photo_id)
      .single()

    if (photo?.tatuador_id && photo.tatuador_id !== uid) {
      // Get saver name
      const { data: saver } = await admin
        .from('users')
        .select('nombre, username')
        .eq('id', uid)
        .single()

      const nombre = saver?.nombre || saver?.username || 'Alguien'

      await admin.from('notifications').insert({
        user_id: photo.tatuador_id,
        type: 'save',
        message: `${nombre} guardó tu foto`,
        from_user_id: uid,
        photo_id,
      })

      // Increment saves_count (fire and forget)
      try {
        await admin.rpc('increment_saves_count', { photo_id_input: photo_id })
      } catch {
        // RPC may not exist — ignore
      }
    }
  } catch (e) {
    console.error('[save-photo] notification error:', e)
    // Don't fail the save just because notification failed
  }

  return NextResponse.json({ ok: true })
}
