'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapPin, X } from 'lucide-react'

const MOTIVOS = [
  { label: 'Todos', value: '' },
  { label: 'Floral', value: 'floral' },
  { label: 'Luna', value: 'luna' },
  { label: 'Letras', value: 'letras' },
  { label: 'Animales', value: 'animales' },
  { label: 'Geométrico', value: 'geometrico' },
  { label: 'Minimalista', value: 'minimalista' },
  { label: 'Mariposa', value: 'mariposa' },
  { label: 'Mandala', value: 'mandala' },
  { label: 'Serpiente', value: 'serpiente' },
  { label: 'Rosa', value: 'rosa' },
]

const ORDENES = [
  { label: 'Recientes', value: 'recientes' },
  { label: 'Más guardados', value: 'guardados' },
  { label: 'Más vistos', value: 'vistos' },
]

export default function GaleriaFiltros() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentQ     = searchParams.get('q') ?? ''
  const currentOrden = searchParams.get('orden') ?? 'recientes'
  const currentCiudad = searchParams.get('ciudad') ?? ''

  const [ciudadInput, setCiudadInput] = useState(currentCiudad)
  const [showCiudadInput, setShowCiudadInput] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)

  useEffect(() => { setCiudadInput(currentCiudad) }, [currentCiudad])

  const buildUrl = (overrides: Record<string, string>) => {
    const params = new URLSearchParams()
    const q = overrides.q ?? currentQ
    const orden = overrides.orden ?? currentOrden
    const ciudad = overrides.ciudad ?? currentCiudad

    if (q) params.set('q', q)
    if (orden && orden !== 'recientes') params.set('orden', orden)
    if (ciudad) params.set('ciudad', ciudad)

    const qs = params.toString()
    return `/galeria${qs ? `?${qs}` : ''}`
  }

  const nav = (overrides: Record<string, string>) => {
    router.push(buildUrl(overrides), { scroll: false })
  }

  const detectCiudad = () => {
    if (!navigator.geolocation) {
      setShowCiudadInput(true)
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=es`,
            { headers: { 'User-Agent': 'tattoosfineline.com' } }
          )
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.village || ''
          if (city) {
            setCiudadInput(city)
            nav({ ciudad: city })
          } else {
            setShowCiudadInput(true)
          }
        } catch {
          setShowCiudadInput(true)
        }
        setGeoLoading(false)
      },
      () => {
        setGeoLoading(false)
        setShowCiudadInput(true)
      },
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }

  const clearCiudad = () => {
    setCiudadInput('')
    setShowCiudadInput(false)
    nav({ ciudad: '' })
  }

  const submitCiudad = () => {
    if (ciudadInput.trim()) {
      nav({ ciudad: ciudadInput.trim() })
      setShowCiudadInput(false)
    }
  }

  return (
    <div className="space-y-3 mb-5">
      {/* Row 1: Motivo filter chips */}
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
        {MOTIVOS.map(f => {
          const isActive = f.value === '' ? !currentQ : currentQ.toLowerCase() === f.value
          return (
            <button
              key={f.value}
              onClick={() => nav({ q: f.value })}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Row 2: Sort + City */}
      <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
        {/* Sort buttons */}
        {ORDENES.map(o => (
          <button
            key={o.value}
            onClick={() => nav({ orden: o.value })}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              currentOrden === o.value
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {o.label}
          </button>
        ))}

        <div className="w-px h-5 bg-gray-200 shrink-0 mx-1" />

        {/* City filter */}
        {currentCiudad ? (
          <button
            onClick={clearCiudad}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-gray-800 text-white"
          >
            <MapPin size={11} />
            {currentCiudad}
            <X size={10} />
          </button>
        ) : showCiudadInput ? (
          <div className="shrink-0 flex items-center gap-1">
            <input
              type="text"
              value={ciudadInput}
              onChange={e => setCiudadInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitCiudad()}
              placeholder="¿En qué ciudad buscas?"
              autoFocus
              className="w-36 px-3 py-1.5 text-xs border border-gray-200 rounded-full focus:outline-none focus:border-gray-400"
            />
            <button onClick={submitCiudad} className="px-2.5 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-full">Ir</button>
            <button onClick={() => setShowCiudadInput(false)} className="p-1 text-gray-400"><X size={12} /></button>
          </div>
        ) : (
          <button
            onClick={detectCiudad}
            disabled={geoLoading}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white text-gray-500 border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50"
          >
            <MapPin size={11} />
            {geoLoading ? 'Detectando...' : 'Cerca de mí'}
          </button>
        )}
      </div>
    </div>
  )
}
