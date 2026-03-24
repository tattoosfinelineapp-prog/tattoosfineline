'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function EditarPerfilPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')
  const [form, setForm] = useState({
    nombre: '',
    bio: '',
    instagram: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }
      setUserId(session.user.id)
      const { data } = await supabase
        .from('users')
        .select('nombre, bio, instagram')
        .eq('id', session.user.id)
        .single()
      if (data) {
        setForm({
          nombre: data.nombre ?? '',
          bio: data.bio ?? '',
          instagram: data.instagram ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [supabase, router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('users')
      .update({
        nombre: form.nombre.trim(),
        bio: form.bio.trim(),
        instagram: form.instagram.trim(),
      })
      .eq('id', userId)
    setSaving(false)
    if (err) { setError(err.message); return }
    setSuccess(true)
    setTimeout(() => router.push(`/perfil/${userId}`), 1200)
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/perfil/${userId}`}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Editar perfil</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
          <input
            type="text"
            value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            placeholder="Tu nombre"
            maxLength={60}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            placeholder="Cuéntanos sobre ti..."
            maxLength={200}
            rows={3}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-all resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{form.bio.length}/200</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Instagram</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
            <input
              type="text"
              value={form.instagram.replace('@', '')}
              onChange={e => setForm(f => ({ ...f, instagram: e.target.value.replace('@', '') }))}
              placeholder="usuario"
              maxLength={40}
              className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
        )}

        {success && (
          <p className="text-sm text-green-600 bg-green-50 px-4 py-3 rounded-xl">
            ¡Perfil actualizado!
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white text-sm font-medium rounded-2xl hover:bg-gray-800 transition-colors disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
