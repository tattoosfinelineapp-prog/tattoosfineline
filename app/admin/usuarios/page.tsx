'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'

type Usuario = {
  id: string
  nombre: string | null
  email: string
  avatar: string | null
  tipo_cuenta: string | null
  username: string | null
  ciudad: string | null
  status: string | null
  created_at: string
  photo_count: number
}

const TIPO_TABS = [
  { id: 'all',         label: 'Todos' },
  { id: 'tatuador',    label: 'Tatuadores' },
  { id: 'estudio',     label: 'Estudios' },
  { id: 'inspiracion', label: 'Usuarios' },
]

export default function AdminUsuarios() {
  const [users, setUsers] = useState<Usuario[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [tipo, setTipo] = useState('all')
  const [loading, setLoading] = useState(true)
  const LIMIT = 30

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/users?tipo=${tipo}&page=${page}`)
    const data = await res.json()
    setUsers(data.users ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [tipo, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(0) }, [tipo])

  const toggleSuspend = async (id: string, currentStatus: string | null) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended'
    const label = newStatus === 'suspended' ? 'Suspender' : 'Reactivar'
    if (!confirm(`¿${label} este usuario?`)) return
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u))
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Gestión de usuarios</h1>
        <p className="text-sm text-gray-400 mt-0.5">{total.toLocaleString('es')} usuarios en total</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TIPO_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setTipo(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tipo === tab.id ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">Sin usuarios en este filtro</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Fotos</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Registro</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden shrink-0">
                        {u.avatar
                          ? <Image src={u.avatar} alt="" width={32} height={32} className="object-cover w-full h-full" />
                          : <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-gray-400">
                              {(u.nombre ?? u.email)[0].toUpperCase()}
                            </div>
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{u.nombre ?? u.email.split('@')[0]}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">
                      {u.tipo_cuenta ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.photo_count}</td>
                  <td className="px-4 py-3">
                    {u.status === 'suspended'
                      ? <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">Suspendido</span>
                      : <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Activo</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(u.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/perfil/${u.username ?? u.id}`}
                        target="_blank"
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        title="Ver perfil"
                      >
                        <ExternalLink size={13} />
                      </Link>
                      <button
                        onClick={() => toggleSuspend(u.id, u.status)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          u.status === 'suspended'
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-red-50 text-red-500 hover:bg-red-100'
                        }`}
                      >
                        {u.status === 'suspended' ? 'Reactivar' : 'Suspender'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-500">Página {page + 1} de {totalPages}</span>
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
