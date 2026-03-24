'use client'

import { Heart, Bookmark, Share2 } from 'lucide-react'
import { useAuth } from './AuthContext'
import type { Tattoo } from '@/lib/data'

export default function TattooActions({ tattoo }: { tattoo: Tattoo }) {
  const { user, likedIds, savedIds, toggleLike, toggleSave, openAuthModal } = useAuth()

  const isLiked = likedIds.has(tattoo.id)
  const isSaved = savedIds.has(tattoo.id)

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: tattoo.title, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleShare}
        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
      >
        <Share2 size={16} />
      </button>
      <button
        onClick={() => user ? toggleSave(tattoo.id) : openAuthModal()}
        className={`p-2 rounded-full transition-colors ${
          isSaved ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
        }`}
      >
        <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
      </button>
      <button
        onClick={() => user ? toggleLike(tattoo.id) : openAuthModal()}
        className={`p-2 rounded-full transition-colors ${
          isLiked ? 'bg-red-50 text-red-500' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
        }`}
      >
        <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}
