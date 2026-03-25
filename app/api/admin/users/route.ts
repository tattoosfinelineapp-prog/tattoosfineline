import { NextResponse } from 'next/server'
import { requireAdmin, getAdminClient } from '../_auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const tipo = searchParams.get('tipo') ?? 'all'
  const page = parseInt(searchParams.get('page') ?? '0')
  const limit = 30
  const from = page * limit
  const to = from + limit - 1

  const admin = getAdminClient()
  let q = admin
    .from('users')
    .select('id, nombre, email, avatar, tipo_cuenta, username, ciudad, status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (tipo !== 'all') q = q.eq('tipo_cuenta', tipo)

  const { data, error, count } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch photo count per user
  const withCounts = await Promise.all(
    (data ?? []).map(async (u: { id: string }) => {
      const { count: photoCount } = await admin
        .from('photos')
        .select('id', { count: 'exact', head: true })
        .eq('tatuador_id', u.id)
      return { ...u, photo_count: photoCount ?? 0 }
    })
  )

  return NextResponse.json({ users: withCounts, total: count ?? 0 })
}
