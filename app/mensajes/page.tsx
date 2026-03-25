'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Send, MessageCircle } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'

type Conversation = {
  partner: { id: string; nombre: string | null; username: string | null; avatar: string | null; tipo_cuenta: string | null }
  lastMessage: string
  lastMessageAt: string
  unread: number
}

type Message = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export default function MensajesPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [chatPartner, setChatPartner] = useState<Conversation['partner'] | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/messages').then(r => r.json()).then(data => {
      setConversations(data.conversations ?? [])
      setLoading(false)
    })
  }, [])

  const openChat = async (partnerId: string) => {
    setActiveChat(partnerId)
    setChatLoading(true)
    const res = await fetch(`/api/messages/${partnerId}`)
    const data = await res.json()
    setMessages(data.messages ?? [])
    setChatPartner(data.partner)
    setChatLoading(false)
    // Mark as read in list
    setConversations(prev => prev.map(c =>
      c.partner.id === partnerId ? { ...c, unread: 0 } : c
    ))
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeChat || sending) return
    setSending(true)
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiver_id: activeChat, content: newMsg.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      setMessages(prev => [...prev, {
        id: data.id,
        sender_id: user!.id,
        receiver_id: activeChat,
        content: newMsg.trim(),
        read: false,
        created_at: new Date().toISOString(),
      }])
      if (data.autoReply) {
        setMessages(prev => [...prev, {
          id: data.autoReply.id,
          sender_id: activeChat,
          receiver_id: user!.id,
          content: data.autoReply.content,
          read: true,
          created_at: data.autoReply.created_at,
        }])
      }
      setNewMsg('')
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
    setSending(false)
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <MessageCircle size={40} className="mx-auto mb-4 text-gray-300" />
        <p className="text-sm text-gray-400">Inicia sesión para ver tus mensajes</p>
      </div>
    )
  }

  // Chat view
  if (activeChat && chatPartner) {
    const partnerName = chatPartner.nombre ?? chatPartner.username ?? 'Usuario'
    return (
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-64px)]">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
          <button onClick={() => setActiveChat(null)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-50">
            <ArrowLeft size={18} />
          </button>
          <Link href={`/${chatPartner.username ?? chatPartner.id}`} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden shrink-0">
              {chatPartner.avatar ? (
                <Image src={chatPartner.avatar} alt="" width={36} height={36} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-gray-400">
                  {partnerName[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{partnerName}</p>
              {chatPartner.tipo_cuenta && chatPartner.tipo_cuenta !== 'inspiracion' && (
                <p className="text-[10px] text-gray-400 capitalize">{chatPartner.tipo_cuenta}</p>
              )}
            </div>
          </Link>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {chatLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10">Sin mensajes todavía</p>
          ) : (
            messages.map(m => (
              <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 text-sm ${
                  m.sender_id === user.id
                    ? 'bg-gray-900 text-white rounded-2xl rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md'
                }`}>
                  {m.content}
                  <p className={`text-[10px] mt-1 ${m.sender_id === user.id ? 'text-gray-400' : 'text-gray-400'}`}>
                    {timeAgo(m.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-100 shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Escribe un mensaje..."
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
            />
            <button
              onClick={sendMessage}
              disabled={!newMsg.trim() || sending}
              className="p-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Conversation list
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Mensajes</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-2xl animate-pulse" />)}
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-20">
          <MessageCircle size={32} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm text-gray-400">No tienes mensajes todavía</p>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map(conv => {
            const name = conv.partner.nombre ?? conv.partner.username ?? 'Usuario'
            return (
              <button
                key={conv.partner.id}
                onClick={() => openChat(conv.partner.id)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors text-left"
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden">
                    {conv.partner.avatar ? (
                      <Image src={conv.partner.avatar} alt="" width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-gray-400">
                        {name[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  {conv.unread > 0 && (
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm ${conv.unread > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'} truncate`}>
                      {name}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">{timeAgo(conv.lastMessageAt)}</span>
                  </div>
                  <p className={`text-xs ${conv.unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'} truncate`}>
                    {conv.lastMessage}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
