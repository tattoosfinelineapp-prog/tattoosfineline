import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// GET — list conversations for current user
export async function GET() {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const uid = session.user.id
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Get all messages involving this user, grouped by conversation partner
  const { data: messages } = await admin
    .from('messages')
    .select('id, sender_id, receiver_id, content, read, created_at')
    .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
    .order('created_at', { ascending: false })

  if (!messages || !messages.length) return NextResponse.json({ conversations: [] })

  // Group by partner
  const convMap = new Map<string, { partnerId: string; lastMessage: typeof messages[0]; unread: number }>()
  for (const m of messages) {
    const partnerId = m.sender_id === uid ? m.receiver_id : m.sender_id
    if (!convMap.has(partnerId)) {
      convMap.set(partnerId, { partnerId, lastMessage: m, unread: 0 })
    }
    if (m.receiver_id === uid && !m.read) {
      const c = convMap.get(partnerId)!
      c.unread++
    }
  }

  // Fetch partner info
  const partnerIds = Array.from(convMap.keys())
  const { data: users } = await admin
    .from('users')
    .select('id, nombre, username, avatar, tipo_cuenta')
    .in('id', partnerIds)

  const userMap = new Map((users ?? []).map(u => [u.id, u]))

  const conversations = Array.from(convMap.values())
    .sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime())
    .map(c => ({
      partner: userMap.get(c.partnerId) ?? { id: c.partnerId, nombre: null, username: null, avatar: null, tipo_cuenta: null },
      lastMessage: c.lastMessage.content,
      lastMessageAt: c.lastMessage.created_at,
      unread: c.unread,
    }))

  return NextResponse.json({ conversations })
}

// POST — send a message
export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { receiver_id, content } = await req.json()
  if (!receiver_id || !content?.trim()) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Check if receiver has messages enabled
  const { data: receiver } = await admin
    .from('users')
    .select('messages_enabled, auto_reply_enabled, auto_reply')
    .eq('id', receiver_id)
    .single()

  if (!receiver?.messages_enabled) {
    return NextResponse.json({ error: 'Este usuario no acepta mensajes' }, { status: 403 })
  }

  // Insert message
  const { data: msg, error } = await admin
    .from('messages')
    .insert({ sender_id: session.user.id, receiver_id, content: content.trim() })
    .select('id, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create notification
  await admin.from('notifications').insert({
    user_id: receiver_id,
    type: 'message',
    message: `Nuevo mensaje`,
    from_user_id: session.user.id,
  })

  // Auto-reply if enabled
  let autoReply = null
  if (receiver.auto_reply_enabled && receiver.auto_reply) {
    const { data: reply } = await admin
      .from('messages')
      .insert({ sender_id: receiver_id, receiver_id: session.user.id, content: receiver.auto_reply })
      .select('id, content, created_at')
      .single()
    autoReply = reply
  }

  return NextResponse.json({ id: msg.id, autoReply })
}
