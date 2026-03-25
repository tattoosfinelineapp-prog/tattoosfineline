'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { Search, MapPin, X } from 'lucide-react'

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import('react-leaflet').then(m => m.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then(m => m.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then(m => m.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then(m => m.Popup),
  { ssr: false }
)

type MapTatuador = {
  id: string
  nombre: string | null
  username: string | null
  avatar: string | null
  ciudad: string | null
  tipo_cuenta: string | null
  lat: number
  lng: number
  precio_desde: number | null
  photos: { id: string; url: string }[]
}

export default function MapaPage() {
  const [tatuadores, setTatuadores] = useState<MapTatuador[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchData = async (q?: string) => {
    const params = q ? `?q=${encodeURIComponent(q)}` : ''
    const res = await fetch(`/api/tatuadores-mapa${params}`)
    const data = await res.json()
    setTatuadores(data.tatuadores ?? [])
    setLoading(false)
  }

  useEffect(() => {
    // Import Leaflet CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    setMapReady(true)
    fetchData()
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchData(query), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  // Custom icon creator (runs client-side only)
  const createIcon = (avatar: string | null, nombre: string | null) => {
    if (typeof window === 'undefined') return undefined
    const L = require('leaflet')
    const initials = (nombre ?? '?')[0].toUpperCase()
    const html = avatar
      ? `<div style="width:36px;height:36px;border-radius:50%;overflow:hidden;border:3px solid #111;background:#111;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><img src="${avatar}" style="width:100%;height:100%;object-fit:cover"/></div>`
      : `<div style="width:36px;height:36px;border-radius:50%;background:#111;border:3px solid #111;color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${initials}</div>`
    return L.divIcon({ html, className: '', iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -36] })
  }

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Search bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] max-w-md mx-auto">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Busca ciudad o tatuador..."
            className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 shadow-lg transition-all"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Map */}
      {mapReady && (
        <MapContainer
          center={[40.4, -3.7]}
          zoom={5}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {tatuadores.map(t => (
            <Marker key={t.id} position={[t.lat, t.lng]} icon={createIcon(t.avatar, t.nombre)}>
              <Popup>
                <div className="w-56 p-0 -m-3">
                  <div className="flex items-center gap-2.5 p-3 pb-2">
                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0">
                      {t.avatar ? (
                        <img src={t.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">
                          {(t.nombre ?? '?')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{t.nombre ?? t.username}</p>
                      <p className="text-xs text-gray-400">
                        {t.ciudad ?? ''}
                        {t.precio_desde ? ` · desde ${t.precio_desde}€` : ''}
                      </p>
                    </div>
                  </div>
                  {t.photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-1 px-3 pb-2">
                      {t.photos.map(p => (
                        <div key={p.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img src={p.url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="px-3 pb-3">
                    <Link
                      href={`/perfil/${t.username ?? t.id}`}
                      className="block w-full text-center py-2 bg-gray-900 text-white text-xs font-medium rounded-xl hover:bg-gray-800 transition-colors"
                    >
                      Ver perfil →
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}

      {/* Empty state */}
      {!loading && tatuadores.length === 0 && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl shadow-lg px-6 py-5 text-center max-w-xs pointer-events-auto">
            <MapPin size={28} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-900 mb-1">
              {query ? `Sin resultados para "${query}"` : 'Sé el primero en aparecer aquí'}
            </p>
            <p className="text-xs text-gray-400">
              {query ? 'Prueba otra búsqueda' : 'Añade tu ciudad en tu perfil y aparecerás en el mapa'}
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center bg-white/80">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
