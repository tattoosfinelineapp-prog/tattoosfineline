'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bookmark, FolderPlus, Loader2 } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/components/AuthContext'
import type { Carpeta } from '@/lib/queries'

type CarpetaConFotos = Carpeta & { preview: string[] }

export default function GuardarPage() {
  const { user, openAuthModal } = useAuth()
  const supabase = createClientComponentClient()
  const [carpetas, setCarpetas] = useState<CarpetaConFotos[]>([])
  const [guardadas, setGuardadas] = useState<{ id: string; url: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [nuevaCarpeta, setNuevaCarpeta] = useState('')
  const [creando, setCreando] = useState(false)
  const [showInput, setShowInput] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const [carpetasRes, savesRes] = await Promise.all([
      supabase.from('carpetas').select('id, nombre, user_id, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('saves').select('photo_id, photos:photo_id(id, url, title)').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])

    type SaveRow = { photo_id: string; photos: { id: string; url: string; title: string } | null }
    const saves = ((savesRes.data ?? []) as unknown as SaveRow[]).map(r => r.photos).filter(Boolean) as { id: string; url: string; title: string }[]
    setGuardadas(saves)

    const carpetasList = (carpetasRes.data ?? []) as Carpeta[]
    const withPreviews: CarpetaConFotos[] = await Promise.all(
      carpetasList.map(async c => {
        const { data } = await supabase
          .from('saves')
          .select('photos:photo_id(url)')
          .eq('user_id', user.id)
          .eq('carpeta_id', c.id)
          .limit(3)
        type PreviewRow = { photos: { url: string } | null }
        const urls = ((data ?? []) as unknown as PreviewRow[]).map(r => r.photos?.url).filter(Boolean) as string[]
        return { ...c, preview: urls }
      })
    )
    setCarpetas(withPreviews)
    setLoading(false)
  }, [user, supabase])

  useEffect(() => { loadData() }, [loadData])

  const handleCrearCarpeta = async () => {
    if (!user || !nuevaCarpeta.trim()) return
    setCreando(true)
    await supabase.from('carpetas').insert({ user_id: user.id, nombre: nuevaCarpeta.trim() })
    setNuevaCarpeta('')
    setShowInput(false)
    setCreando(false)
    loadData()
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Bookmark size={40} className="mx-auto mb-4 text-gray-300" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Guardados</h1>
        <p className="text-sm text-gray-400 mb-6">Inicia sesión para ver y organizar tus fotos guardadas</p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          Iniciar sesión
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Guardados</h1>
          <p className="text-sm text-gray-400 mt-1">{guardadas.length} fotos guardadas</p>
        </div>
        <button
          onClick={() => setShowInput(!showInput)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          <FolderPlus size={16} />
          Nueva carpeta
        </button>
      </div>

      {showInput && (
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Nombre de la carpeta"
            value={nuevaCarpeta}
            onChange={e => setNuevaCarpeta(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCrearCarpeta()}
            autoFocus
            className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <button
            onClick={handleCrearCarpeta}
            disabled={creando || !nuevaCarpeta.trim()}
            className="px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {creando ? <Loader2 size={16} className="animate-spin" /> : 'Crear'}
          </button>
        </div>
      )}

      {carpetas.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Carpetas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {carpetas.map(c => (
              <Link key={c.id} href={`/tablero/${c.id}`}>
                <div className="bg-gray-50 rounded-2xl overflow-hidden hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="grid grid-cols-3 h-24">
                    {c.preview.length > 0 ? (
                      c.preview.map((url, i) => (
                        <div key={i} className="relative overflow-hidden">
                          <Image src={url} alt="" fill className="object-cover" />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 flex items-center justify-center bg-gray-100">
                        <Bookmark size={24} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-gray-900 text-sm">{c.nombre}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {guardadas.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Todas las fotos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {guardadas.map(p => (
              <Link key={p.id} href={`/tattoo/${p.id}`}>
                <div className="rounded-2xl overflow-hidden bg-gray-50 hover:shadow-md transition-shadow">
                  <Image src={p.url} alt={p.title} width={200} height={200} className="w-full object-cover aspect-square" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {guardadas.length === 0 && carpetas.length === 0 && (
        <div className="text-center py-24 text-gray-400">
          <Bookmark size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aún no has guardado ninguna foto</p>
          <p className="text-xs mt-1">Haz clic en el ícono de marcador en cualquier foto</p>
        </div>
      )}
    </div>
  )
}
