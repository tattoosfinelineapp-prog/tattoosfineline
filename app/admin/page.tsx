'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Image as ImageIcon, Users, Upload, UserPlus, Flag } from 'lucide-react'

type Stats = {
  totalFotos: number
  totalUsuarios: number
  fotosHoy: number
  usuariosHoy: number
  reportadas: number
  ultimasFotos: {
    id: string
    url: string
    title: string
    status: string
    created_at: string
    users: { nombre: string | null } | null
  }[]
}

const STATUS_LABEL: Record<string, { label: string; class: string }> = {
  published: { label: 'Publicada',  class: 'bg-green-50 text-green-700' },
  pending:   { label: 'Pendiente',  class: 'bg-amber-50 text-amber-700' },
  review:    { label: 'Revisión',   class: 'bg-orange-50 text-orange-700' },
  rejected:  { label: 'Rechazada', class: 'bg-red-50 text-red-500' },
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats)
  }, [])

  if (!stats) {
    return (
      <div className="p-8">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const statCards = [
    { label: 'Total fotos',     value: stats.totalFotos.toLocaleString('es'),    icon: ImageIcon,  color: 'text-blue-500' },
    { label: 'Total usuarios',  value: stats.totalUsuarios.toLocaleString('es'), icon: Users,      color: 'text-purple-500' },
    { label: 'Fotos hoy',       value: stats.fotosHoy.toLocaleString('es'),      icon: Upload,     color: 'text-green-500' },
    { label: 'Usuarios hoy',    value: stats.usuariosHoy.toLocaleString('es'),   icon: UserPlus,   color: 'text-teal-500' },
    { label: 'Reportadas',      value: stats.reportadas.toLocaleString('es'),    icon: Flag,       color: 'text-red-500', href: '/admin/reportes' },
  ]

  return (
    <div className="p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Vista general de tattoosfineline</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, href }) => {
          const card = (
            <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 ${href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
              <div className={`${color} mb-3`}><Icon size={18} /></div>
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          )
          return href
            ? <Link key={label} href={href}>{card}</Link>
            : <div key={label}>{card}</div>
        })}
      </div>

      {/* Últimas fotos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Últimas fotos subidas</h2>
          <Link href="/admin/fotos" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Ver todas →</Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
              <th className="px-6 py-3 font-medium">Foto</th>
              <th className="px-4 py-3 font-medium">Título</th>
              <th className="px-4 py-3 font-medium">Autor</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {stats.ultimasFotos.map(foto => {
              const st = STATUS_LABEL[foto.status] ?? { label: foto.status, class: 'bg-gray-100 text-gray-500' }
              return (
                <tr key={foto.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      <Image src={foto.url} alt={foto.title} width={40} height={40} className="object-cover w-full h-full" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">{foto.title || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{foto.users?.nombre ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.class}`}>{st.label}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(foto.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
