'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Send, MessageCircle, Bot } from 'lucide-react'

type Props = {
  receiverId: string
  receiverName: string
  receiverAvatar: string | null
  onClose: () => void
}

export default function SendMessageModal({ receiverId, receiverName, receiverAvatar, onClose }: Props) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [autoReply, setAutoReply] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSend = async () => {
    if (!content.trim() || sending) return
    setSending(true)
    setError('')

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver_id: receiverId, content: content.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al enviar')
        setSending(false)
        return
      }

      setSent(true)
      if (data.autoReply) {
        setAutoReply(data.autoReply.content)
      }
    } catch {
      setError('Error de red')
    }
    setSending(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0">
              {receiverAvatar ? (
                <Image src={receiverAvatar} alt="" width={40} height={40} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-gray-400">
                  {receiverName[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{receiverName}</p>
              <p className="text-xs text-gray-400">Mensaje directo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-50 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          {!sent ? (
            <>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Escribe tu mensaje..."
                maxLength={500}
                rows={4}
                autoFocus
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-all resize-none"
              />
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-400">{content.length}/500</p>
                <button
                  onClick={handleSend}
                  disabled={!content.trim() || sending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40"
                >
                  <Send size={14} />
                  {sending ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            </>
          ) : (
            <div className="space-y-4">
              {/* Sent message bubble */}
              <div className="flex justify-end">
                <div className="bg-gray-900 text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-md max-w-[80%]">
                  {content}
                </div>
              </div>

              {/* Auto-reply bubble */}
              {autoReply && (
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={12} className="text-gray-400" />
                  </div>
                  <div className="bg-gray-100 text-gray-700 text-sm px-4 py-2.5 rounded-2xl rounded-bl-md max-w-[80%]">
                    {autoReply}
                    <p className="text-[10px] text-gray-400 mt-1.5">Respuesta automática</p>
                  </div>
                </div>
              )}

              <div className="text-center pt-2">
                <MessageCircle size={20} className="mx-auto mb-2 text-green-500" />
                <p className="text-sm font-medium text-gray-900">Mensaje enviado</p>
                <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 mt-2 transition-colors">
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
