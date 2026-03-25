'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import FeedCard, { type FeedPhoto } from '@/components/FeedCard'
import { useAuth } from '@/components/AuthContext'
import { Compass } from 'lucide-react'

export default function FeedPage() {
  const { user } = useAuth()
  const [photos, setPhotos] = useState<FeedPhoto[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [hasFollows, setHasFollows] = useState(true)
  const [isWeeklyFallback, setIsWeeklyFallback] = useState(false)
  const [seenIds, setSeenIds] = useState<string[]>([])
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingRef  = useRef(false)
  const doneRef     = useRef(false)

  const load = useCallback(async (currentOffset: number, currentSeen: string[]) => {
    if (loadingRef.current || doneRef.current) return
    loadingRef.current = true
    setLoading(true)

    const params = new URLSearchParams({
      offset: String(currentOffset),
      seen:   currentSeen.slice(-40).join(','),
    })
    const res  = await fetch(`/api/feed?${params}`)
    const json = await res.json()

    const newPhotos: FeedPhoto[] = json.photos ?? []

    setPhotos(prev => {
      const existingIds = new Set(prev.map(p => p.id))
      return [...prev, ...newPhotos.filter(p => !existingIds.has(p.id))]
    })
    setSeenIds(prev => [...prev, ...newPhotos.map(p => p.id)])
    setOffset(json.offset ?? currentOffset + newPhotos.length)
    setHasFollows(json.hasFollows ?? true)
    setIsWeeklyFallback(json.isWeeklyFallback ?? false)

    if (newPhotos.length < 20) {
      doneRef.current = true
      setHasMore(false)
    }

    setLoading(false)
    loadingRef.current = false
  }, [])

  // Initial load
  useEffect(() => {
    load(0, [])
  }, [load])

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loadingRef.current && !doneRef.current) {
          setOffset(prev => {
            setSeenIds(prevSeen => {
              load(prev, prevSeen)
              return prevSeen
            })
            return prev
          })
        }
      },
      { rootMargin: '300px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [load])

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="max-w-xl mx-auto px-0 sm:px-4">
        <div className="flex items-center justify-between px-4 py-4 sm:px-0">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {isWeeklyFallback ? 'Lo más popular esta semana' : 'Tu feed'}
            </h1>
            {isWeeklyFallback && (
              <p className="text-xs text-gray-400">No hay suficientes fotos recientes — ampliado a 7 días</p>
            )}
          </div>
        </div>

        {/* Banner: no follows */}
        {!hasFollows && user && (
          <div className="mx-4 sm:mx-0 mb-4 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-800">Personaliza tu feed</p>
              <p className="text-xs text-gray-500 mt-0.5">Sigue tatuadores para ver su trabajo aquí</p>
            </div>
            <Link
              href="/onboarding"
              className="shrink-0 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-xl hover:bg-gray-700 transition-colors flex items-center gap-1.5"
            >
              <Compass size={12} />
              Descubrir
            </Link>
          </div>
        )}

        {/* Photo stream */}
        <div>
          {photos.map(photo => (
            <FeedCard key={photo.id} photo={photo} />
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && photos.length === 0 && (
          <div className="space-y-px">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border-b border-gray-100 pb-4 mb-2 animate-pulse">
                <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-24 bg-gray-100 rounded" />
                    <div className="h-2.5 w-16 bg-gray-100 rounded" />
                  </div>
                </div>
                <div className="bg-gray-100 mx-0 h-72" />
              </div>
            ))}
          </div>
        )}

        {loading && photos.length > 0 && (
          <p className="text-center text-sm text-gray-400 py-6">Cargando más...</p>
        )}

        {!hasMore && photos.length > 0 && (
          <p className="text-center text-xs text-gray-300 py-8">Has visto todo por ahora</p>
        )}

        {!user && photos.length === 0 && !loading && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-sm">Inicia sesión para ver tu feed personalizado</p>
          </div>
        )}

        <div ref={sentinelRef} className="h-4" />
      </div>
    </div>
  )
}
