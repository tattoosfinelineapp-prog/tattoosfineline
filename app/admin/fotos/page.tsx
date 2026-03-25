'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { CheckCircle, EyeOff, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

type Foto = {
  id: string
  url: string
  title: string
  status: string
  confidence: number | null
  tags: string[] | null
  motivo: string | null
  zona: string | null
  created_at: string
  reported_count: number | null
  users: { id: string; nombre: string | null; username: string | null } | null
}

const STATUS_TABS = [
  { id: 'all',       label: 'Todas' },
  { id: 'published', label: 'Publicadas' },
  { id: 'pending',   label: 'Revisión' },
  { id: 'review',    label: 'Manual' },
]

const STATUS_LABEL: Record<string, { label: string; class: string }> = {
  published: { label: 'Publicada', class: 'bg-green-50 text-green-700' },
  pending:   { label: 'Pendiente', class: 'bg-amber-50 text-amber-700' },
  review:    { label: 'Revisión',  class: 'bg-orange-50 text-orange-700' },
  rejected:  { label: 'Rechazada',class: 'bg-red-50 text-red-500' },
}

export default function AdminFotos() {
  const [fotos, setFotos] = useState<Foto[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const LIMIT = 24

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/photos?status=${status}&page=${page}`)
    const data = await res.json()
    setFotos(data.photos ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [status, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(0) }, [status])

  const updateStatus = async (id: string, newStatus: string) => {
    await fetch(`/api/admin/photos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setFotos(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f))
  }

  const deleteFoto = async (id: string) => {
    if (!confirm('¿Eliminar esta foto? Esta acción no se puede deshacer.')) return
    await fetch(`/api/admin/photos/${id}`, { method: 'DELETE' })
    setFotos(prev => prev.filter(f => f.id !== id))
    setTotal(t => t - 1)
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Gestión de fotos</h1>
        <p className="text-sm text-gray-400 mt-0.5">{total.toLocaleString('es')} fotos en total</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatus(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              status === tab.id ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : fotos.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">Sin fotos en este filtro</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {fotos.map(foto => {
            const st = STATUS_LABEL[foto.status] ?? { label: foto.status, class: 'bg-gray-100 text-gray-500' }
            return (
              <div key={foto.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="relative aspect-square bg-gray-100">
                  <Image src={foto.url} alt={foto.title} fill className="object-cover" sizes="200px" />
                  <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium ${st.class}`}>
                    {st.label}
                  </span>
                  {(foto.reported_count ?? 0) > 0 && (
                    <span className="absolute top-2 right-2 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                      {foto.reported_count}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium text-gray-800 truncate mb-0.5">{foto.title || '—'}</p>
                  <p className="text-xs text-gray-400 truncate mb-2">
                    {foto.users?.nombre ?? '—'} · {foto.motivo ?? '—'}
                  </p>
                  {foto.tags && foto.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {foto.tags.slice(0, 3).map(t => (
                        <span key={t} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">#{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    {foto.status !== 'published' && (
                      <button
                        onClick={() => updateStatus(foto.id, 'published')}
                        title="Aprobar"
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-xs font-medium transition-colors"
                      >
                        <CheckCircle size={12} /> Aprobar
                      </button>
                    )}
                    {foto.status !== 'rejected' && (
                      <button
                        onClick={() => updateStatus(foto.id, 'rejected')}
                        title="Ocultar"
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 text-xs font-medium transition-colors"
                      >
                        <EyeOff size={12} /> Ocultar
                      </button>
                    )}
                    <button
                      onClick={() => deleteFoto(foto.id)}
                      title="Eliminar"
                      className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-500">
            Página {page + 1} de {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
