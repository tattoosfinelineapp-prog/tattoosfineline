import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Get photo and verify ownership
  const { data: photo } = await admin
    .from('photos')
    .select('id, url, tatuador_id')
    .eq('id', params.id)
    .single()

  if (!photo) return NextResponse.json({ error: 'Foto no encontrada' }, { status: 404 })
  if (photo.tatuador_id !== session.user.id) {
    return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 })
  }

  // Delete from Storage
  if (photo.url) {
    const urlObj = new URL(photo.url)
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/photos\/(.+)/)
    if (pathMatch) {
      await admin.storage.from('photos').remove([pathMatch[1]])
    }
  }

  // Delete from DB
  await admin.from('photos').delete().eq('id', params.id)

  // Revalidate
  revalidatePath('/galeria')
  revalidatePath('/perfil', 'layout')

  return NextResponse.json({ ok: true })
}
