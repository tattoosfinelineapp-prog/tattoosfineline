import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// GET — get messages with a specific partner
export async function GET(_req: Request, { params }: { params: { partnerId: string } }) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const uid = session.user.id
  const pid = params.partnerId
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Get messages between the two users
  const { data: messages } = await admin
    .from('messages')
    .select('id, sender_id, receiver_id, content, read, created_at')
    .or(`and(sender_id.eq.${uid},receiver_id.eq.${pid}),and(sender_id.eq.${pid},receiver_id.eq.${uid})`)
    .order('created_at', { ascending: true })
    .limit(100)

  // Mark received messages as read
  await admin
    .from('messages')
    .update({ read: true })
    .eq('sender_id', pid)
    .eq('receiver_id', uid)
    .eq('read', false)

  // Get partner info
  const { data: partner } = await admin
    .from('users')
    .select('id, nombre, username, avatar, tipo_cuenta')
    .eq('id', pid)
    .single()

  return NextResponse.json({ messages: messages ?? [], partner })
}
