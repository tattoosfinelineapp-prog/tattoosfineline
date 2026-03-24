'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Bookmark, User } from 'lucide-react'
import type { Tattoo } from '@/lib/data'
import { useAuth } from './AuthContext'
import ReportButton from './ReportButton'

export default function TattooCard({ tattoo }: { tattoo: Tattoo }) {
  const { user, likedIds, savedIds, toggleLike, openSaveModal, openAuthModal } = useAuth()
  const [hovered, setHovered] = useState(false)
  const [imgError, setImgError] = useState(false)

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
    user ? openSaveModal(tattoo.id) : openAuthModal()
  }

  const aspectRatio = `400/${tattoo.height || 350}`

  return (
    <Link href={`/tattoo/${tattoo.id}`}>
      <div
        className="relative rounded-2xl overflow-hidden bg-gray-100 cursor-pointer group"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {imgError ? (
          <div
            className="w-full bg-gray-100 flex items-center justify-center"
            style={{ aspectRatio }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        ) : (
          <Image
            src={tattoo.url}
            alt={tattoo.alt_text || tattoo.title}
            width={400}
            height={tattoo.height || 350}
            className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            onError={() => setImgError(true)}
          />
        )}

        {/* Overlay gradient */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-200 ${
            hovered ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Top right: Save + Report */}
        <div
          className={`absolute top-2.5 right-2.5 flex flex-col gap-1.5 transition-opacity duration-200 ${
            hovered || isSaved ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            onClick={handleSave}
            className={`p-2 rounded-full shadow-md backdrop-blur-sm transition-colors ${
              isSaved
                ? 'bg-gray-900 text-white'
                : 'bg-white/90 text-gray-700 hover:bg-white'
            }`}
          >
            <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
          <ReportButton photoId={tattoo.id} />
        </div>

        {/* Bottom overlay: artist + like */}
        <div
          className={`absolute bottom-0 left-0 right-0 p-3 transition-opacity duration-200 ${
            hovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <User size={10} className="text-white" />
              </div>
              <span className="text-xs text-white font-medium drop-shadow truncate">{tattoo.tatuador}</span>
            </div>
            <button
              onClick={handleLike}
              className="flex items-center gap-1 text-white shrink-0 ml-2"
            >
              <Heart
                size={14}
                fill={isLiked ? '#E60023' : 'none'}
                stroke={isLiked ? '#E60023' : 'white'}
                className={`drop-shadow transition-transform ${isLiked ? 'scale-110' : ''}`}
              />
              <span className="text-xs drop-shadow">{tattoo.likes}</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
