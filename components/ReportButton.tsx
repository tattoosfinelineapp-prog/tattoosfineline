'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Flag, Check } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from './AuthContext'

const MOTIVOS = [
  { id: 'no_fineline',       label: 'No es fine line' },
  { id: 'inapropiado',       label: 'Contenido inapropiado' },
  { id: 'cara_sin_permiso',  label: 'Cara sin permiso' },
  { id: 'copyright',         label: 'Copyright' },
  { id: 'spam',              label: 'Spam' },
]

export default function ReportButton({ photoId }: { photoId: string }) {
  const { user, openAuthModal } = useAuth()
  const supabase = createClientComponentClient()
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleReport = async (motivo: string) => {
    if (!user) { openAuthModal('login'); setOpen(false); return }
    setSending(true)
    await supabase.from('reports').insert({ photo_id: photoId, reporter_id: user.id, motivo })
    setSending(false)
    setSent(true)
    setTimeout(() => { setSent(false); setOpen(false) }, 2000)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(v => !v) }}
        className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white hover:text-gray-900 transition-colors shadow-sm"
        title="Opciones"
      >
        <MoreHorizontal size={14} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 w-44 z-50" onClick={e => e.stopPropagation()}>
          {sent ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-green-600">
              <Check size={14} />
              Reporte enviado
            </div>
          ) : (
            <>
              <p className="px-4 py-1.5 text-xs text-gray-400 font-medium">Reportar</p>
              {MOTIVOS.map(m => (
                <button
                  key={m.id}
                  onClick={() => handleReport(m.id)}
                  disabled={sending}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
                >
                  <Flag size={13} className="text-gray-400" />
                  {m.label}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
