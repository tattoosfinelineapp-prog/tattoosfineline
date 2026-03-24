'use client'

import { useEffect, useRef, useState } from 'react'
import GaleriaGrid from './GaleriaGrid'
import type { Tattoo } from '@/lib/data'

const PAGE_SIZE = 24

type Props = {
  initialPhotos: Tattoo[]
  initialTotal: number
  query?: string
}

export default function GaleriaInfinita({ initialPhotos, initialTotal, query = '' }: Props) {
  const [photos, setPhotos] = useState<Tattoo[]>(initialPhotos)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(initialPhotos.length >= initialTotal)

  // Refs to read mutable state inside the observer callback without stale closures
  const pageRef = useRef(1)
  const loadingRef = useRef(false)
  const doneRef = useRef(initialPhotos.length >= initialTotal)
  const queryRef = useRef(query)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Sync refs
  doneRef.current = done
  queryRef.current = query

  // Reset when initial data changes (query changed on server)
  useEffect(() => {
    setPhotos(initialPhotos)
    setTotal(initialTotal)
    setDone(initialPhotos.length >= initialTotal)
    doneRef.current = initialPhotos.length >= initialTotal
    pageRef.current = 1
    loadingRef.current = false
  }, [initialPhotos, initialTotal])

  // Set up observer once — reads from refs, never re-created due to stale closure
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return
        if (loadingRef.current || doneRef.current) return

        loadingRef.current = true
        setLoading(true)

        try {
          const params = new URLSearchParams({
            page: String(pageRef.current),
            limit: String(PAGE_SIZE),
            ...(queryRef.current ? { q: queryRef.current } : {}),
          })
          const res = await fetch(`/api/photos?${params}`)
          const { photos: newPhotos, total: newTotal } = await res.json()

          setPhotos(prev => {
            const ids = new Set(prev.map(p => p.id))
            const merged = [...prev, ...(newPhotos as Tattoo[]).filter(p => !ids.has(p.id))]
            const isDone = merged.length >= newTotal
            doneRef.current = isDone
            setDone(isDone)
            return merged
          })
          setTotal(newTotal)
          pageRef.current += 1
        } catch {
          // silently fail — user can trigger by scrolling again
        } finally {
          loadingRef.current = false
          setLoading(false)
        }
      },
      { rootMargin: '300px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, []) // Only mount/unmount — uses refs for all mutable state

  if (photos.length === 0 && !loading) {
    return (
      <div className="text-center py-24 text-gray-400">
        <p className="text-lg font-medium text-gray-700 mb-1">
          {query ? `Sin resultados para "${query}"` : 'No hay tatuajes'}
        </p>
        <p className="text-sm">Prueba con: floral, luna, mariposa, brazo...</p>
      </div>
    )
  }

  return (
    <div>
      {query && total > 0 && (
        <p className="text-sm text-gray-500 mb-5">
          <span className="font-medium text-gray-800">{total.toLocaleString('es')}</span>{' '}
          resultado{total !== 1 ? 's' : ''} para{' '}
          <span className="font-medium text-gray-800">&ldquo;{query}&rdquo;</span>
        </p>
      )}

      <GaleriaGrid tattoos={photos} />

      <div ref={sentinelRef} className="h-px" />

      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 rounded-full border-2 border-gray-200 border-t-gray-500 animate-spin" />
        </div>
      )}

      {done && photos.length > 0 && !loading && (
        <p className="text-center text-sm text-gray-400 py-10">
          {photos.length.toLocaleString('es')} de {total.toLocaleString('es')} tatuajes
        </p>
      )}
    </div>
  )
}
