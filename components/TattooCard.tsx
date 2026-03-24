'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Bookmark, User } from 'lucide-react'
import type { Tattoo } from '@/lib/data'
import { useAuth } from './AuthContext'

export default function TattooCard({ tattoo }: { tattoo: Tattoo }) {
  const { user, likedIds, savedIds, toggleLike, toggleSave, openAuthModal } = useAuth()
  const [hovered, setHovered] = useState(false)

  const isLiked = likedIds.has(tattoo.id)
  const isSaved = savedIds.has(tattoo.id)

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    user ? toggleLike(tattoo.id) : openAuthModal()
  }

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    user ? toggleSave(tattoo.id) : openAuthModal()
  }

  return (
    <Link href={`/tattoo/${tattoo.id}`}>
      <div
        className="relative rounded-2xl overflow-hidden bg-gray-50 shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer group"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative w-full" style={{ paddingBottom: `${((tattoo.height || 350) / 400) * 100}%` }}>
          <Image
            src={tattoo.url}
            alt={tattoo.alt_text || tattoo.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        </div>

        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent transition-opacity duration-300 ${
            hovered ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div
          className={`absolute top-3 right-3 flex flex-col gap-2 transition-opacity duration-300 ${
            hovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            onClick={handleSave}
            className={`p-2 rounded-full shadow-sm backdrop-blur-sm transition-colors ${
              isSaved ? 'bg-gray-900 text-white' : 'bg-white/90 text-gray-700 hover:bg-white'
            }`}
          >
            <Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div
          className={`absolute bottom-0 left-0 right-0 p-3 transition-opacity duration-300 ${
            hovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <User size={12} className="text-white" />
              </div>
              <span className="text-xs text-white font-medium drop-shadow">{tattoo.tatuador}</span>
            </div>
            <button
              onClick={handleLike}
              className="flex items-center gap-1 text-white"
            >
              <Heart
                size={15}
                fill={isLiked ? 'white' : 'none'}
                className="drop-shadow"
              />
              <span className="text-xs drop-shadow">
                {tattoo.likes + (isLiked && tattoo.likes === 0 ? 1 : 0)}
              </span>
            </button>
          </div>
        </div>

        <div className="absolute top-3 left-3">
          <span className="text-xs bg-white/90 backdrop-blur-sm text-gray-600 px-2 py-0.5 rounded-full font-medium capitalize">
            {tattoo.motivo}
          </span>
        </div>
      </div>
    </Link>
  )
}
