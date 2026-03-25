'use client'

import { useEffect, useState, useCallback } from 'react'
import { Download } from 'lucide-react'

type EmailUser = {
  email: string
  nombre: string | null
  tipo_cuenta: string | null
  created_at: string
}

const TABS = [
  { id: 'all',         label: 'Todos' },
  { id: 'tatuador',    label: 'Tatuadores' },
  { id: 'estudio',     label: 'Estudios' },
  { id: 'inspiracion', label: 'Usuarios' },
]

function toCSV(users: EmailUser[]): string {
  const header = 'email,nombre,tipo,fecha_registro'
  const rows = users.map(u =>
    [
      u.email,
      (u.nombre ?? '').replace(/,/g, ' '),
      u.tipo_cuenta ?? '',
      new Date(u.created_at).toISOString().split('T')[0],
    ].join(',')
  )
  return [header, ...rows].join('\n')
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminEmails() {
  const [users, setUsers] = useState<EmailUser[]>([])
  const [tipo, setTipo] = useState('all')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/emails?tipo=${tipo}`)
    const data = await res.json()
    setUsers(data.users ?? [])
    setLoading(false)
  }, [tipo])

  useEffect(() => { load() }, [load])

  const exportCSV = () => {
    const csv = toCSV(users)
    const label = tipo === 'all' ? 'todos' : tipo + 's'
    downloadCSV(csv, `tattoosfineline_emails_${label}_${new Date().toISOString().split('T')[0]}.csv`)
  }

  const countByTipo = (t: string) =>
    t === 'all' ? users.length : users.filter(u => u.tipo_cuenta === t).length

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Base de datos de emails</h1>
          <p className="text-sm text-gray-400 mt-0.5">{users.length.toLocaleString('es')} emails en este segmento</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={loading || users.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40"
        >
          <Download size={14} />
          Exportar CSV
        </button>
      </div>

      {/* Tabs con contadores */}
      <div className="flex gap-2 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setTipo(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tipo === tab.id ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label} ({countByTipo(tab.id).toLocaleString('es')})
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {TABS.filter(t => t.id !== 'all').map(tab => (
          <div key={tab.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-2xl font-semibold text-gray-900">{countByTipo(tab.id).toLocaleString('es')}</p>
            <p className="text-xs text-gray-400 mt-0.5">{tab.label}</p>
          </div>
        ))}
        <div className="bg-gray-900 rounded-2xl p-5 text-white">
          <p className="text-2xl font-semibold">{users.length.toLocaleString('es')}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(10)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Registro</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm text-gray-700">{u.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.nombre ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">
                      {u.tipo_cuenta ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(u.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
