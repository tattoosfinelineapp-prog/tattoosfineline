'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { X, Bookmark, FolderPlus, Loader2, Check } from 'lucide-react'

type Carpeta = { id: string; nombre: string }
type Props = {
  photoId: string
  onClose: () => void
  onSaved: (carpetaId?: string) => void
  onUnsave: () => void
  isSaved: boolean
}

export default function SaveModal({ photoId, onClose, onSaved, onUnsave, isSaved }: Props) {
  const supabase = createClientComponentClient()
  const [carpetas, setCarpetas] = useState<Carpeta[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [nuevaNombre, setNuevaNombre] = useState('')
  const [creandoCarpeta, setCreandoCarpeta] = useState(false)
  const [showInput, setShowInput] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase
        .from('carpetas')
        .select('id, nombre')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      setCarpetas((data ?? []) as Carpeta[])
      setLoading(false)
    }
    load()
  }, [supabase])

  const handleSaveToBoard = async (carpetaId?: string) => {
    setSaving(carpetaId ?? 'none')
    onSaved(carpetaId)
    setSaving(null)
    onClose()
  }

  const handleCrearYGuardar = async () => {
    if (!nuevaNombre.trim()) return
    setCreandoCarpeta(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: nueva } = await supabase
      .from('carpetas')
      .insert({ user_id: session.user.id, nombre: nuevaNombre.trim() })
      .select('id, nombre')
      .single()

    if (nueva) {
      onSaved(nueva.id)
      onClose()
    }
    setCreandoCarpeta(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-sm mx-0 sm:mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Guardar en tablero</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Boards list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Save without board */}
              <button
                onClick={() => isSaved ? (onUnsave(), onClose()) : handleSaveToBoard(undefined)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Bookmark size={16} className="text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {isSaved ? 'Quitar de guardados' : 'Guardar'}
                  </p>
                  <p className="text-xs text-gray-400">Sin clasificar</p>
                </div>
                {isSaved && <Check size={16} className="text-gray-900" />}
              </button>

              {/* Existing boards */}
              {carpetas.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSaveToBoard(c.id)}
                  disabled={saving === c.id}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    {saving === c.id
                      ? <Loader2 size={16} className="animate-spin text-gray-400" />
                      : <span className="text-sm font-semibold text-gray-500">{c.nombre[0].toUpperCase()}</span>
                    }
                  </div>
                  <p className="text-sm font-medium text-gray-900 flex-1">{c.nombre}</p>
                </button>
              ))}
            </>
          )}
        </div>

        {/* Create new board */}
        <div className="px-3 pb-4 pt-2 border-t border-gray-100">
          {showInput ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nombre del tablero"
                value={nuevaNombre}
                onChange={e => setNuevaNombre(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCrearYGuardar()}
                autoFocus
                className="flex-1 px-3 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
              <button
                onClick={handleCrearYGuardar}
                disabled={creandoCarpeta || !nuevaNombre.trim()}
                className="px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {creandoCarpeta ? <Loader2 size={14} className="animate-spin" /> : 'Crear'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowInput(true)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <FolderPlus size={16} className="text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-700">Crear tablero nuevo</p>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
