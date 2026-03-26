'use client'

import { Heart, Flame, Bookmark, Share2 } from 'lucide-react'
import { useAuth } from './AuthContext'
import type { Tattoo } from '@/lib/data'

export default function TattooActions({ tattoo }: { tattoo: Tattoo }) {
  const { user, lovedIds, wantedIds, savedIds, toggleLove, toggleWant, toggleSave, openAuthModal } = useAuth()

  const isLoved = lovedIds.has(tattoo.id)
  const isWanted = wantedIds.has(tattoo.id)
  const isSaved = savedIds.has(tattoo.id)

  const handleShare = () => {
    const url = `${window.location.origin}/foto/${tattoo.id}`
    if (navigator.share) {
      navigator.share({ title: tattoo.tags.join(', '), url })
    } else {
      navigator.clipboard.writeText(url)
    }
  }

  return (
    <div className="flex gap-2">
      <button onClick={handleShare} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600">
        <Share2 size={16} />
      </button>
      <button onClick={() => user ? toggleSave(tattoo.id) : openAuthModal()}
        className={`p-2 rounded-full transition-colors ${isSaved ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
        <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
      </button>
      <button onClick={() => user ? toggleLove(tattoo.id) : openAuthModal()}
        className={`p-2 rounded-full transition-colors ${isLoved ? 'bg-red-50 text-red-500' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
        <Heart size={16} fill={isLoved ? 'currentColor' : 'none'} />
      </button>
      <button onClick={() => user ? toggleWant(tattoo.id) : openAuthModal()}
        className={`p-2 rounded-full transition-colors ${isWanted ? 'bg-orange-50 text-orange-500' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
        <Flame size={16} fill={isWanted ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}
