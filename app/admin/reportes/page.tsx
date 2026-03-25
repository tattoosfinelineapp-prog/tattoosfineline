'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { CheckCircle, Trash2 } from 'lucide-react'

type Foto = {
  id: string
  url: string
  title: string
  status: string
  reported_count: number | null
  created_at: string
  users: { nombre: string | null; username: string | null } | null
}

export default function AdminReportes() {
  const [fotos, setFotos] = useState<Foto[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/photos?status=review&page=0')
    const data = await res.json()
    setFotos(data.photos ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const aprobar = async (id: string) => {
    await fetch(`/api/admin/photos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' }),
    })
    setFotos(prev => prev.filter(f => f.id !== id))
  }

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta foto?')) return
    await fetch(`/api/admin/photos/${id}`, { method: 'DELETE' })
    setFotos(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Fotos reportadas</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Fotos con estado &ldquo;revisión manual&rdquo; o reportadas por usuarios
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : fotos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-20">
          <p className="text-green-600 font-medium text-sm">Todo en orden — no hay fotos pendientes de revisión</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fotos.map(foto => (
            <div key={foto.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 p-4">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                <Image src={foto.url} alt={foto.title} fill className="object-cover" sizes="80px" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{foto.title || 'Sin título'}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Subida por {foto.users?.nombre ?? '—'}
                  {foto.users?.username ? ` (@${foto.users.username})` : ''}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(foto.created_at).toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
                {(foto.reported_count ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-red-500 mt-1.5">
                    {foto.reported_count} reporte{(foto.reported_count ?? 0) > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => aprobar(foto.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-sm font-medium transition-colors"
                >
                  <CheckCircle size={14} />
                  Es válida — publicar
                </button>
                <button
                  onClick={() => eliminar(foto.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-sm font-medium transition-colors"
                >
                  <Trash2 size={14} />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
