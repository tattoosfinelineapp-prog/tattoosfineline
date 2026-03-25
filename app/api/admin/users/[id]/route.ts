import { NextResponse } from 'next/server'
import { requireAdmin, getAdminClient } from '../../_auth'

export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { status } = await req.json()
  const admin = getAdminClient()
  const { error } = await admin.from('users').update({ status }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
