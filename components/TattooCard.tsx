'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Heart, Bookmark, User, MapPin } from 'lucide-react'
import type { Tattoo } from '@/lib/data'
import { useAuth } from './AuthContext'
import ReportButton from './ReportButton'
import PhotoModal from './PhotoModal'

export default function TattooCard({ tattoo, isLocal }: { tattoo: Tattoo; isLocal?: boolean }) {
  const { user, lovedIds, savedIds, toggleLove, openSaveModal, openAuthModal } = useAuth()
  const [hovered, setHovered] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const isLoved = lovedIds.has(tattoo.id)
  const isSaved = savedIds.has(tattoo.id)

  const handleLove = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    user ? toggleLove(tattoo.id) : openAuthModal()
  }

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    user ? openSaveModal(tattoo.id) : openAuthModal()
  }

  const aspectRatio = `400/${tattoo.height || 350}`

  return (
    <>
      <div
        className="relative rounded-2xl overflow-hidden bg-gray-100 cursor-pointer group"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setModalOpen(true)}
      >
        {imgError ? (
          <div className="w-full bg-gray-100 flex items-center justify-center" style={{ aspectRatio }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
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
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+"
            onError={() => setImgError(true)}
          />
        )}

        <div className={`absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`} />

        {isLocal && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-medium px-2 py-1 rounded-full shadow-sm">
            <MapPin size={9} /> En tu ciudad
          </div>
        )}

        <div className={`absolute top-2.5 right-2.5 flex flex-col gap-1.5 transition-opacity duration-200 ${hovered || isSaved ? 'opacity-100' : 'opacity-0'}`}>
          <button onClick={handleSave} className={`p-2 rounded-full shadow-md backdrop-blur-sm transition-colors ${isSaved ? 'bg-gray-900 text-white' : 'bg-white/90 text-gray-700 hover:bg-white'}`}>
            <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
          <ReportButton photoId={tattoo.id} />
        </div>

        <div className={`absolute bottom-0 left-0 right-0 p-3 transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <User size={10} className="text-white" />
              </div>
              <span className="text-xs text-white font-medium drop-shadow truncate">{tattoo.tatuador}</span>
            </div>
            <button onClick={handleLove} className="flex items-center gap-1 text-white shrink-0 ml-2">
              <Heart size={14} fill={isLoved ? '#E60023' : 'none'} stroke={isLoved ? '#E60023' : 'white'} className={`drop-shadow transition-transform ${isLoved ? 'scale-110' : ''}`} />
              <span className="text-xs drop-shadow">{tattoo.likes}</span>
            </button>
          </div>
        </div>
      </div>

      {modalOpen && <PhotoModal tattoo={tattoo} onClose={() => setModalOpen(false)} />}
    </>
  )
}
