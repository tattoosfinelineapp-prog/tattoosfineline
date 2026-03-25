'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, MapPin, ChevronRight, Sparkles } from 'lucide-react'

type Resultado = {
  id: string
  nombre: string | null
  username: string | null
  avatar: string | null
  ciudad: string | null
  foto_url: string | null
  foto_tags: string[] | null
}

const ZONAS = [
  'Brazo', 'Antebrazo', 'Muñeca', 'Mano', 'Dedo',
  'Pierna', 'Tobillo', 'Pie', 'Espalda', 'Pecho',
  'Cuello', 'Costilla', 'Hombro', 'Oreja',
]

export default function BuscarArtistaPage() {
  const [step, setStep] = useState(1)
  const [descripcion, setDescripcion] = useState('')
  const [zona, setZona] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [ciudadSuggestions, setCiudadSuggestions] = useState<{ display_name: string; address: { city?: string; town?: string } }[]>([])
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!ciudad.trim() || ciudad.length < 2) { setCiudadSuggestions([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(ciudad)}&format=json&limit=5&addressdetails=1&accept-language=es`,
          { headers: { 'User-Agent': 'tattoosfineline.com' } }
        )
        setCiudadSuggestions(await res.json())
      } catch {}
    }, 300)
  }, [ciudad])

  const buscar = async () => {
    setLoading(true)
    setStep(5)
    try {
      const res = await fetch(`/api/buscar-artista`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion, zona, ciudad }),
      })
      const data = await res.json()
      setResultados(data.resultados ?? [])
    } catch {
      setResultados([])
    }
    setLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10 pb-24">
      <div className="text-center mb-8">
        <Sparkles size={28} className="mx-auto mb-3 text-gray-300" />
        <h1 className="text-2xl font-semibold text-gray-900">Encuentra tu tatuador ideal</h1>
        <p className="text-sm text-gray-400 mt-1">Te ayudamos a encontrar el artista perfecto</p>
      </div>

      {/* Progress */}
      <div className="flex gap-1 mb-8">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`flex-1 h-1 rounded-full ${step >= s ? 'bg-gray-900' : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* Step 1: Descripción */}
      {step === 1 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">¿Qué quieres tatuarte?</p>
          <textarea
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Una rosa con espinas en la muñeca, estilo fine line muy delicado..."
            rows={4}
            autoFocus
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-all resize-none"
          />
          <button
            onClick={() => setStep(2)}
            disabled={!descripcion.trim()}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white text-sm font-medium rounded-2xl hover:bg-gray-800 transition-colors disabled:opacity-40"
          >
            Siguiente <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Step 2: Zona */}
      {step === 2 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">¿En qué zona del cuerpo?</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {ZONAS.map(z => (
              <button
                key={z}
                onClick={() => { setZona(z); setStep(3) }}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                  zona === z ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {z}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Ciudad */}
      {step === 3 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">¿En qué ciudad buscas?</p>
          <div className="relative">
            <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={ciudad}
              onChange={e => setCiudad(e.target.value)}
              placeholder="Madrid, Barcelona..."
              autoFocus
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
            />
            {ciudadSuggestions.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {ciudadSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setCiudad(s.address.city || s.address.town || ciudad); setCiudadSuggestions([]); setStep(4) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 truncate"
                  >
                    {s.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setStep(4)}
            disabled={!ciudad.trim()}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white text-sm font-medium rounded-2xl hover:bg-gray-800 transition-colors disabled:opacity-40"
          >
            Siguiente <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Step 4: Summary → Buscar */}
      {step === 4 && (
        <div className="text-center">
          <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-left space-y-2">
            <p className="text-sm text-gray-500">Quiero: <span className="text-gray-900 font-medium">{descripcion}</span></p>
            <p className="text-sm text-gray-500">Zona: <span className="text-gray-900 font-medium">{zona}</span></p>
            <p className="text-sm text-gray-500">Ciudad: <span className="text-gray-900 font-medium">{ciudad}</span></p>
          </div>
          <button
            onClick={buscar}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900 text-white text-sm font-semibold rounded-2xl hover:bg-gray-800 transition-colors"
          >
            <Search size={16} />
            Buscar artistas
          </button>
        </div>
      )}

      {/* Step 5: Results */}
      {step === 5 && (
        <div>
          {loading ? (
            <div className="text-center py-16">
              <Sparkles size={24} className="mx-auto mb-3 text-gray-300 animate-pulse" />
              <p className="text-sm text-gray-400">Buscando artistas perfectos...</p>
            </div>
          ) : resultados.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-gray-500 mb-4">No encontramos artistas exactos en {ciudad}</p>
              <Link href="/galeria" className="text-sm text-gray-900 font-medium hover:underline">
                Explorar toda la galería →
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700 mb-4">
                {resultados.length} artista{resultados.length !== 1 ? 's' : ''} en {ciudad}
              </p>
              <div className="space-y-3">
                {resultados.map(r => (
                  <Link
                    key={r.id}
                    href={`/perfil/${r.username ?? r.id}`}
                    className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-sm transition-shadow"
                  >
                    {r.foto_url && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        <Image src={r.foto_url} alt="" width={64} height={64} className="object-cover w-full h-full" />
                      </div>
                    )}
                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0">
                      {r.avatar
                        ? <Image src={r.avatar} alt="" width={40} height={40} className="object-cover w-full h-full" />
                        : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">{(r.nombre ?? '?')[0].toUpperCase()}</div>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{r.nombre ?? r.username}</p>
                      <p className="text-xs text-gray-400">{r.ciudad}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
