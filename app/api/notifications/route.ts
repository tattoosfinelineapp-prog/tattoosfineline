import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ count: 0 })

  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', session.user.id)
    .eq('leida', false)

  return NextResponse.json({ count: count ?? 0 })
}

export async function PATCH() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ ok: false })

  await supabase
    .from('notifications')
    .update({ leida: true })
    .eq('user_id', session.user.id)
    .eq('leida', false)

  return NextResponse.json({ ok: true })
}
