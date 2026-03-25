import { NextResponse } from 'next/server'
import { requireAdmin, getAdminClient } from '../_auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'all'
  const page = parseInt(searchParams.get('page') ?? '0')
  const limit = 24
  const from = page * limit
  const to = from + limit - 1

  const admin = getAdminClient()
  let q = admin
    .from('photos')
    .select('id, url, title, status, confidence, tags, motivo, zona, created_at, reported_count, users(id, nombre, username)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status !== 'all') q = q.eq('status', status)

  const { data, error, count } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ photos: data ?? [], total: count ?? 0 })
}
