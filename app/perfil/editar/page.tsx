'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ArrowLeft, Save, MapPin, Camera } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type CiudadSuggestion = {
  display_name: string
  lat: string
  lon: string
  address: { city?: string; town?: string; village?: string; country?: string; state?: string }
}

export default function EditarPerfilPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')
  const [tipoCuenta, setTipoCuenta] = useState('')
  const [form, setForm] = useState({
    nombre: '',
    bio: '',
    instagram: '',
    ciudad: '',
    lat: null as number | null,
    lng: null as number | null,
    country: '',
    precio_desde: '',
    messages_enabled: false,
    auto_reply_enabled: false,
    auto_reply: '',
  })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // City autocomplete
  const [ciudadInput, setCiudadInput] = useState('')
  const [ciudadSuggestions, setCiudadSuggestions] = useState<CiudadSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const ciudadDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }
      setUserId(session.user.id)
      const { data } = await supabase
        .from('users')
        .select('nombre, bio, instagram, tipo_cuenta, ciudad, lat, lng, country, precio_desde, messages_enabled, auto_reply_enabled, auto_reply, avatar')
        .eq('id', session.user.id)
        .single()
      if (data) {
        setAvatarUrl(data.avatar ?? null)
        setTipoCuenta(data.tipo_cuenta ?? '')
        setCiudadInput(data.ciudad ?? '')
        setForm({
          nombre: data.nombre ?? '',
          bio: data.bio ?? '',
          instagram: data.instagram ?? '',
          ciudad: data.ciudad ?? '',
          lat: data.lat ?? null,
          lng: data.lng ?? null,
          country: data.country ?? '',
          precio_desde: data.precio_desde ? String(data.precio_desde) : '',
          messages_enabled: data.messages_enabled ?? false,
          auto_reply_enabled: data.auto_reply_enabled ?? false,
          auto_reply: data.auto_reply ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [supabase, router])

  // City search with debounce
  useEffect(() => {
    if (ciudadDebounceRef.current) clearTimeout(ciudadDebounceRef.current)
    if (!ciudadInput.trim() || ciudadInput === form.ciudad) {
      setCiudadSuggestions([])
      return
    }
    ciudadDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(ciudadInput)}&format=json&limit=5&addressdetails=1&accept-language=es`,
          { headers: { 'User-Agent': 'tattoosfineline.com' } }
        )
        const data = await res.json()
        setCiudadSuggestions(data ?? [])
        setShowSuggestions(true)
      } catch {
        setCiudadSuggestions([])
      }
    }, 300)
    return () => { if (ciudadDebounceRef.current) clearTimeout(ciudadDebounceRef.current) }
  }, [ciudadInput]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectCiudad = (s: CiudadSuggestion) => {
    const city = s.address.city || s.address.town || s.address.village || ciudadInput
    const country = s.address.country ?? ''
    setCiudadInput(city)
    setForm(f => ({
      ...f,
      ciudad: city,
      lat: parseFloat(s.lat),
      lng: parseFloat(s.lon),
      country,
    }))
    setCiudadSuggestions([])
    setShowSuggestions(false)
  }

  const handleAvatarUpload = async (file: File) => {
    setAvatarUploading(true)
    try {
      // Compress to 400x400
      const bitmap = await createImageBitmap(file)
      const canvas = document.createElement('canvas')
      canvas.width = 400; canvas.height = 400
      const ctx = canvas.getContext('2d')!
      const size = Math.min(bitmap.width, bitmap.height)
      const sx = (bitmap.width - size) / 2
      const sy = (bitmap.height - size) / 2
      ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, 400, 400)
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob(b => resolve(b!), 'image/webp', 0.85)
      )

      const fileName = `${userId}/avatar-${Date.now()}.webp`
      const { error: storErr } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { contentType: 'image/webp', upsert: true })

      if (storErr) {
        // Fallback: try photos bucket
        const { error: storErr2 } = await supabase.storage
          .from('photos')
          .upload(`avatars/${fileName}`, blob, { contentType: 'image/webp', upsert: true })
        if (storErr2) { setError('Error al subir avatar: ' + storErr2.message); setAvatarUploading(false); return }
        const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(`avatars/${fileName}`)
        setAvatarUrl(publicUrl)
        await supabase.from('users').update({ avatar: publicUrl }).eq('id', userId)
      } else {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
        setAvatarUrl(publicUrl)
        await supabase.from('users').update({ avatar: publicUrl }).eq('id', userId)
      }
    } catch (e) {
      setError('Error al procesar la imagen')
    }
    setAvatarUploading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const updateData: Record<string, unknown> = {
      nombre: form.nombre.trim(),
      bio: form.bio.trim(),
      instagram: form.instagram.trim(),
      ciudad: form.ciudad || null,
      lat: form.lat,
      lng: form.lng,
      country: form.country || null,
      messages_enabled: form.messages_enabled,
      auto_reply_enabled: form.auto_reply_enabled,
      auto_reply: form.auto_reply.trim() || null,
    }
    if (form.precio_desde) {
      updateData.precio_desde = parseInt(form.precio_desde) || null
    } else {
      updateData.precio_desde = null
    }

    const { error: err } = await supabase
      .from('users')
      .update(updateData)
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
    <div className="max-w-lg mx-auto px-4 py-10 pb-24">
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
        {/* Avatar upload */}
        <div className="flex justify-center mb-2">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="relative group"
            disabled={avatarUploading}
          >
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="" width={96} height={96} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                  {form.nombre?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {avatarUploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera size={18} className="text-white" />
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) handleAvatarUpload(f)
              }}
            />
          </button>
        </div>

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

        {/* Ciudad with autocomplete */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ciudad</label>
          <div className="relative">
            <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={ciudadInput}
              onChange={e => { setCiudadInput(e.target.value); setForm(f => ({ ...f, ciudad: '', lat: null, lng: null, country: '' })) }}
              onFocus={() => ciudadSuggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Madrid, Barcelona, Valencia..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
            />
            {form.lat && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                Ubicación guardada
              </span>
            )}
          </div>
          {showSuggestions && ciudadSuggestions.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {ciudadSuggestions.map((s, i) => {
                const city = s.address.city || s.address.town || s.address.village || ''
                const label = city ? `${city}, ${s.address.state ?? ''}, ${s.address.country ?? ''}` : s.display_name
                return (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={() => selectCiudad(s)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <MapPin size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Precio desde — only for tatuadores/estudios */}
        {(tipoCuenta === 'tatuador' || tipoCuenta === 'estudio') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio desde</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Pieza pequeña desde</span>
              <input
                type="number"
                value={form.precio_desde}
                onChange={e => setForm(f => ({ ...f, precio_desde: e.target.value }))}
                placeholder="0"
                min={0}
                max={9999}
                className="w-full pl-[160px] pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">€</span>
            </div>
          </div>
        )}

        {/* Message settings — only for tatuadores/estudios */}
        {(tipoCuenta === 'tatuador' || tipoCuenta === 'estudio') && (
          <div className="border-t border-gray-100 pt-5 space-y-4">
            <p className="text-sm font-semibold text-gray-900">Mensajes</p>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm text-gray-700">Permitir mensajes</p>
                <p className="text-xs text-gray-400">Los usuarios podrán enviarte mensajes directos</p>
              </div>
              <input
                type="checkbox"
                checked={form.messages_enabled}
                onChange={e => setForm(f => ({ ...f, messages_enabled: e.target.checked }))}
                className="w-10 h-6 bg-gray-200 rounded-full relative appearance-none cursor-pointer checked:bg-gray-900 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform checked:after:translate-x-4"
              />
            </label>

            {form.messages_enabled && (
              <>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm text-gray-700">Respuesta automática</p>
                    <p className="text-xs text-gray-400">Se envía al recibir un mensaje</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.auto_reply_enabled}
                    onChange={e => setForm(f => ({ ...f, auto_reply_enabled: e.target.checked }))}
                    className="w-10 h-6 bg-gray-200 rounded-full relative appearance-none cursor-pointer checked:bg-gray-900 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform checked:after:translate-x-4"
                  />
                </label>

                {form.auto_reply_enabled && (
                  <div>
                    <textarea
                      value={form.auto_reply}
                      onChange={e => setForm(f => ({ ...f, auto_reply: e.target.value }))}
                      placeholder="Hola! Agendo por Instagram @usuario. ¡Gracias por escribir!"
                      maxLength={200}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-all resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">{form.auto_reply.length}/200</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

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
