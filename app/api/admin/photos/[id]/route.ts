import { NextResponse } from 'next/server'
import { requireAdmin, getAdminClient } from '../../_auth'

export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { status } = await req.json()
  const admin = getAdminClient()
  const { error } = await admin.from('photos').update({ status }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = getAdminClient()

  // Get the photo URL to delete from storage
  const { data: photo } = await admin.from('photos').select('url, tatuador_id').eq('id', params.id).single()

  if (photo?.url) {
    // Extract the storage path from the URL
    const urlObj = new URL(photo.url)
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/photos\/(.+)/)
    if (pathMatch) {
      await admin.storage.from('photos').remove([pathMatch[1]])
    }
  }

  const { error } = await admin.from('photos').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
