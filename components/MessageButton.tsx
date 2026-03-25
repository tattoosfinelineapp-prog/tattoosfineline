'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { useAuth } from './AuthContext'
import SendMessageModal from './SendMessageModal'

type Props = {
  targetUserId: string
  targetName: string
  targetAvatar: string | null
  messagesEnabled: boolean
}

export default function MessageButton({ targetUserId, targetName, targetAvatar, messagesEnabled }: Props) {
  const { user, openAuthModal } = useAuth()
  const [showModal, setShowModal] = useState(false)

  if (!messagesEnabled) return null

  const handleClick = () => {
    if (!user) { openAuthModal('login'); return }
    setShowModal(true)
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
      >
        <MessageCircle size={14} />
        Mensaje
      </button>
      {showModal && (
        <SendMessageModal
          receiverId={targetUserId}
          receiverName={targetName}
          receiverAvatar={targetAvatar}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
