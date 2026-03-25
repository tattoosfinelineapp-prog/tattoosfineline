import { NextResponse } from 'next/server'
import { requireAdmin, getAdminClient } from '../_auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const tipo = searchParams.get('tipo') ?? 'all'

  const admin = getAdminClient()
  let q = admin
    .from('users')
    .select('email, nombre, tipo_cuenta, created_at')
    .order('created_at', { ascending: false })

  if (tipo !== 'all') q = q.eq('tipo_cuenta', tipo)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ users: data ?? [] })
}
