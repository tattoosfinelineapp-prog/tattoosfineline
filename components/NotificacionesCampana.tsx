'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Bell, X, Heart, Bookmark, UserPlus, Tag, Trophy } from 'lucide-react'
import { useAuth } from './AuthContext'
import Image from 'next/image'
import Link from 'next/link'

type Notification = {
  id: string
  tipo: string
  mensaje: string
  leida: boolean
  created_at: string
  photo_id: string | null
  from_user_id: string | null
  from_user?: { nombre: string | null; avatar: string | null; username: string | null } | null
  photo?: { url: string } | null
}

function tipoIcon(tipo: string) {
  switch (tipo) {
    case 'nuevo_seguidor':      return <UserPlus  size={14} className="text-blue-500" />
    case 'like_foto':           return <Heart     size={14} className="text-red-500" />
    case 'foto_guardada':       return <Bookmark  size={14} className="text-purple-500" />
    case 'etiqueta_tatuador':   return <Tag       size={14} className="text-green-500" />
    case 'milestone_seguidores':return <Trophy    size={14} className="text-yellow-500" />
    default:                    return <Bell      size={14} className="text-gray-400" />
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  return `hace ${Math.floor(hrs / 24)}d`
}

export default function NotificacionesCampana() {
  const { user } = useAuth()
  const supabase = createClientComponentClient()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  const fetchUnread = useCallback(async () => {
    if (!user) return
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('leida', false)
    setUnread(count ?? 0)
  }, [user, supabase])

  const fetchNotifs = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select(`
        id, tipo, mensaje, leida, created_at, photo_id, from_user_id,
        from_user:from_user_id(nombre, avatar, username),
        photo:photo_id(url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
    setNotifs((data ?? []) as unknown as Notification[])
    setLoading(false)
  }, [user, supabase])

  const markAllRead = useCallback(async () => {
    if (!user || unread === 0) return
    await supabase
      .from('notifications')
      .update({ leida: true })
      .eq('user_id', user.id)
      .eq('leida', false)
    setUnread(0)
    setNotifs(prev => prev.map(n => ({ ...n, leida: true })))
  }, [user, unread, supabase])

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 60000)
    return () => clearInterval(interval)
  }, [fetchUnread])

  const handleOpen = async () => {
    setOpen(true)
    await fetchNotifs()
    await markAllRead()
  }

  if (!user) return null

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
        title="Notificaciones"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {/* Panel overlay */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Notificaciones</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading && (
                <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                  Cargando...
                </div>
              )}
              {!loading && notifs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Bell size={32} className="mb-3 opacity-30" />
                  <p className="text-sm">Sin notificaciones</p>
                </div>
              )}
              {notifs.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 transition-colors hover:bg-gray-50 ${
                    !n.leida ? 'bg-blue-50/40' : ''
                  }`}
                >
                  {/* Avatar del remitente */}
                  <div className="shrink-0 relative">
                    {n.from_user?.avatar ? (
                      <Image
                        src={n.from_user.avatar}
                        alt=""
                        width={36}
                        height={36}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">
                        {n.from_user?.nombre?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-px">
                      {tipoIcon(n.tipo)}
                    </span>
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-snug">{n.mensaje}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                    {n.from_user?.username && (
                      <Link
                        href={`/perfil/${n.from_user.username}`}
                        className="text-xs text-gray-500 hover:underline mt-0.5 block"
                        onClick={() => setOpen(false)}
                      >
                        @{n.from_user.username}
                      </Link>
                    )}
                  </div>

                  {/* Miniatura si hay foto */}
                  {n.photo?.url && (
                    <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={n.photo.url}
                        alt=""
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}
