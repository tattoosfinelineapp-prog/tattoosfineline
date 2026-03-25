'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, Heart, Bookmark, Share2, User, ExternalLink } from 'lucide-react'
import { useAuth } from './AuthContext'
import type { Tattoo } from '@/lib/data'

type Props = {
  tattoo: Tattoo
  onClose: () => void
}

export default function PhotoModal({ tattoo, onClose }: Props) {
  const { user, likedIds, savedIds, toggleLike, openSaveModal, openAuthModal } = useAuth()
  const [similares, setSimilares] = useState<Tattoo[]>([])
  const [copied, setCopied] = useState(false)

  const isLiked = likedIds.has(tattoo.id)
  const isSaved = savedIds.has(tattoo.id)

  useEffect(() => {
    // Push URL without navigation
    window.history.pushState(null, '', `/foto/${tattoo.id}`)

    // Fetch similar photos
    fetch(`/api/photos?q=${encodeURIComponent(tattoo.motivo || tattoo.tags[0] || '')}&limit=6`)
      .then(r => r.json())
      .then(data => {
        const filtered = (data.photos ?? []).filter((p: Tattoo) => p.id !== tattoo.id).slice(0, 6)
        setSimilares(filtered)
      })

    // Close on Escape
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
      window.history.pushState(null, '', '/galeria')
    }
  }, [tattoo.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const share = async () => {
    const url = `${window.location.origin}/foto/${tattoo.id}`
    if (navigator.share) {
      try { await navigator.share({ title: tattoo.alt_text || 'Tatuaje fine line', url }) } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 bg-white rounded-3xl shadow-2xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 text-gray-600 hover:bg-gray-100 transition-colors shadow-sm">
          <X size={18} />
        </button>

        <div className="grid md:grid-cols-2">
          {/* Left: Photo */}
          <div className="bg-gray-50 flex items-center justify-center p-4 md:p-6 md:rounded-l-3xl">
            <Image
              src={tattoo.url}
              alt={tattoo.alt_text || tattoo.title}
              width={600}
              height={tattoo.height || 600}
              className="w-full h-auto max-h-[70vh] object-contain rounded-2xl"
              priority
            />
          </div>

          {/* Right: Info */}
          <div className="p-6 flex flex-col">
            {/* Author */}
            <Link
              href={`/${tattoo.tatuador_id}`} /* tatuador_id works as slug fallback */
              className="flex items-center gap-3 mb-5 group"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                <User size={16} className="text-gray-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 group-hover:underline truncate">{tattoo.tatuador}</p>
                {tattoo.ciudad && <p className="text-xs text-gray-400">{tattoo.ciudad}</p>}
              </div>
            </Link>

            {/* Tags */}
            {tattoo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {tattoo.tags.map(tag => (
                  <Link
                    key={tag}
                    href={`/galeria?q=${encodeURIComponent(tag)}`}
                    onClick={onClose}
                    className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => user ? toggleLike(tattoo.id) : openAuthModal()}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isLiked ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                {tattoo.likes}
              </button>
              <button
                onClick={() => user ? openSaveModal(tattoo.id) : openAuthModal()}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isSaved ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
                {isSaved ? 'Guardada' : 'Guardar'}
              </button>
              <button
                onClick={share}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <Share2 size={16} />
                {copied ? '¡Copiado!' : 'Compartir'}
              </button>
            </div>

            {/* Details */}
            <div className="text-xs text-gray-400 space-y-1 mb-6">
              {tattoo.motivo && <p>Motivo: <span className="text-gray-600">{tattoo.motivo}</span></p>}
              {tattoo.zona && <p>Zona: <span className="text-gray-600">{tattoo.zona}</span></p>}
              {tattoo.tamaño && <p>Tamaño: <span className="text-gray-600">{tattoo.tamaño}</span></p>}
            </div>

            {/* Similar photos */}
            {similares.length > 0 && (
              <div className="mt-auto">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Más como esto</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {similares.map(s => (
                    <Link key={s.id} href={`/tattoo/${s.id}`} onClick={onClose} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                      <Image src={s.url} alt="" width={120} height={120} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
