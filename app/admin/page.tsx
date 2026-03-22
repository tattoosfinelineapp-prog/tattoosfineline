'use client'

import { useState } from 'react'
import Image from 'next/image'
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react'
import { tattoosSample } from '@/lib/data'

type Estado = 'pending' | 'published' | 'rejected'

type Item = {
  id: string
  url: string
  title: string
  confidence: number
  estado: Estado
  tags: string[]
  motivo: string
  zona: string
}

const adminItems: Item[] = tattoosSample.slice(0, 6).map((t, i) => ({
  id: t.id,
  url: t.url,
  title: t.title,
  confidence: i % 3 === 0 ? 0.55 : i % 3 === 1 ? 0.72 : 0.91,
  estado: i % 3 === 0 ? 'pending' : i % 3 === 1 ? 'pending' : 'published',
  tags: t.tags,
  motivo: t.motivo,
  zona: t.zona,
}))

const confidenceBadge = (c: number) => {
  if (c >= 0.85) return 'bg-green-50 text-green-700'
  if (c >= 0.60) return 'bg-amber-50 text-amber-700'
  return 'bg-orange-50 text-orange-700'
}

export default function AdminPage() {
  const [items, setItems] = useState(adminItems)
  const [filtro, setFiltro] = useState<Estado | 'all'>('all')

  const update = (id: string, estado: Estado) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, estado } : item))
  }

  const visible = filtro === 'all' ? items : items.filter(i => i.estado === filtro)

  const counts = {
    all: items.length,
    pending: items.filter(i => i.estado === 'pending').length,
    published: items.filter(i => i.estado === 'published').length,
    rejected: items.filter(i => i.estado === 'rejected').length,
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Panel de revisión</h1>
        <p className="text-sm text-gray-400">Revisa y modera las fotos pendientes</p>
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'published', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtro === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : f === 'published' ? 'Publicados' : 'Rechazados'} ({counts[f]})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.map(item => (
          <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-200 shrink-0">
              <Image src={item.url} alt={item.title} fill className="object-cover" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 truncate">{item.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.motivo} · {item.zona}</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {item.tags.slice(0, 3).map(t => (
                  <span key={t} className="text-xs bg-white text-gray-400 px-1.5 py-0.5 rounded-full">#{t}</span>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${confidenceBadge(item.confidence)}`}>
                {(item.confidence * 100).toFixed(0)}%
              </span>

              {item.estado === 'pending' ? (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => update(item.id, 'published')}
                    className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                    title="Publicar"
                  >
                    <CheckCircle size={16} />
                  </button>
                  <button
                    onClick={() => update(item.id, 'rejected')}
                    className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                    title="Rechazar"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs">
                  {item.estado === 'published' ? (
                    <span className="flex items-center gap-1 text-green-600"><CheckCircle size={13} /> Publicado</span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-500"><XCircle size={13} /> Rechazado</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
