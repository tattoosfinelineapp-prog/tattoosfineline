'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { MapPin } from 'lucide-react'
import GaleriaGrid from './GaleriaGrid'
import type { Tattoo } from '@/lib/data'

const PAGE_SIZE = 24

type Props = {
  initialPhotos: Tattoo[]
  initialTotal: number
  query?: string
}

export default function GaleriaInfinita({ initialPhotos, initialTotal, query = '' }: Props) {
  const searchParams = useSearchParams()
  const orden  = searchParams.get('orden') ?? 'recientes'
  const ciudad = searchParams.get('ciudad') ?? ''

  const [photos, setPhotos] = useState<Tattoo[]>(initialPhotos)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(initialPhotos.length >= initialTotal)

  const pageRef = useRef(1)
  const loadingRef = useRef(false)
  const doneRef = useRef(initialPhotos.length >= initialTotal)
  const queryRef = useRef(query)
  const ordenRef = useRef(orden)
  const ciudadRef = useRef(ciudad)
  const sentinelRef = useRef<HTMLDivElement>(null)

  doneRef.current = done
  queryRef.current = query
  ordenRef.current = orden
  ciudadRef.current = ciudad

  // Reset when data or filters change
  useEffect(() => {
    setPhotos(initialPhotos)
    setTotal(initialTotal)
    setDone(initialPhotos.length >= initialTotal)
    doneRef.current = initialPhotos.length >= initialTotal
    pageRef.current = 1
    loadingRef.current = false
  }, [initialPhotos, initialTotal])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    let timeout: ReturnType<typeof setTimeout>

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
          })
          if (queryRef.current) params.set('q', queryRef.current)
          if (ordenRef.current && ordenRef.current !== 'recientes') params.set('orden', ordenRef.current)
          if (ciudadRef.current) params.set('ciudad', ciudadRef.current)

          const res = await fetch(`/api/photos?${params}`)
          const { photos: newPhotos, total: newTotal } = await res.json()

          let finalPhotos = newPhotos as Tattoo[]

          // If filtered results run out, fetch popular photos to keep scrolling
          if (finalPhotos.length === 0 && queryRef.current) {
            const fallbackParams = new URLSearchParams({
              page: String(pageRef.current),
              limit: String(PAGE_SIZE),
              orden: 'guardados',
            })
            const fbRes = await fetch(`/api/photos?${fallbackParams}`)
            const fbData = await fbRes.json()
            finalPhotos = fbData.photos ?? []
          }

          setPhotos(prev => {
            const ids = new Set(prev.map(p => p.id))
            const merged = [...prev, ...finalPhotos.filter(p => !ids.has(p.id))]
            const isDone = finalPhotos.length === 0
            doneRef.current = isDone
            setDone(isDone)
            return merged
          })
          setTotal(newTotal)
          pageRef.current += 1
        } catch {
          // silently fail
        } finally {
          loadingRef.current = false
          setLoading(false)
        }
      },
      { rootMargin: '400px' }
    )

    timeout = setTimeout(() => observer.observe(sentinel), 100)
    return () => { clearTimeout(timeout); observer.disconnect() }
  }, [])

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
          {ciudad && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
              <MapPin size={10} /> {ciudad} primero
            </span>
          )}
        </p>
      )}

      <GaleriaGrid tattoos={photos} ciudad={ciudad} />

      <div ref={sentinelRef} className="h-px" />

      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 rounded-full border-2 border-gray-200 border-t-gray-500 animate-spin" />
        </div>
      )}

      {done && photos.length > 0 && !loading && (
        <div className="text-center py-10">
          <p className="text-sm text-gray-300">Has visto todos los tatuajes disponibles</p>
        </div>
      )}
    </div>
  )
}
