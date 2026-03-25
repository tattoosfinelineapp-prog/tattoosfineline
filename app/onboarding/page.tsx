'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, CheckCircle } from 'lucide-react'

type Tatuador = {
  id: string
  nombre: string | null
  username: string | null
  avatar: string | null
  ciudad: string | null
  tipo_cuenta: string | null
  followers_count: number
  photo_count: number
}

export default function OnboardingPage() {
  const supabase = createClientComponentClient()
  const router   = useRouter()

  // step 0 = elegir tipo (solo si Google user sin tipo elegido)
  // step 1 = seguir tatuadores
  // step 2 = CTA subir fotos (tatuadores/estudios)
  const [step, setStep]             = useState(0)
  const [tatuadores, setTatuadores] = useState<Tatuador[]>([])
  const [filtered, setFiltered]     = useState<Tatuador[]>([])
  const [followed, setFollowed]     = useState<Set<string>>(new Set())
  const [query, setQuery]           = useState('')
  const [tipoCuenta, setTipoCuenta] = useState<string>('inspiracion')
  const [finishing, setFinishing]   = useState(false)
  const [savingTipo, setSavingTipo] = useState(false)

  useEffect(() => {
    // If tipo was set via email/password registration (stored in localStorage),
    // skip step 0 and go straight to step 1.
    const tipo = localStorage.getItem('tipo_cuenta')
    if (tipo) {
      setTipoCuenta(tipo)
      setStep(1)
    } else {
      // Google user — check DB for current tipo_cuenta
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) return
        supabase.from('users').select('tipo_cuenta').eq('id', session.user.id).single()
          .then(({ data }) => {
            const dbTipo = data?.tipo_cuenta
            if (dbTipo && dbTipo !== 'inspiracion') {
              // Already has a real tipo — skip step 0
              setTipoCuenta(dbTipo)
              setStep(1)
            }
            // else: stay on step 0 so they can choose
          })
      })
    }

    // Fetch top 12 tatuadores/estudios by followers_count
    async function fetchTatuadores() {
      const { data } = await supabase
        .from('users')
        .select('id, nombre, username, avatar, ciudad, tipo_cuenta, followers_count')
        .in('tipo_cuenta', ['tatuador', 'estudio'])
        .order('followers_count', { ascending: false })
        .limit(24)

      if (!data) return
      // Fetch photo count per user
      const withCounts = await Promise.all(
        (data as Omit<Tatuador, 'photo_count'>[]).map(async (u) => {
          const { count } = await supabase
            .from('photos')
            .select('id', { count: 'exact', head: true })
            .eq('tatuador_id', u.id)
            .eq('status', 'published')
          return { ...u, photo_count: count ?? 0 }
        })
      )
      // Sort by photo_count * followers_count (engagement proxy), limit 12
      const sorted = withCounts
        .sort((a, b) => (b.photo_count * (b.followers_count + 1)) - (a.photo_count * (a.followers_count + 1)))
        .slice(0, 12)
      setTatuadores(sorted)
      setFiltered(sorted)
    }
    fetchTatuadores()
  }, [supabase])

  useEffect(() => {
    if (!query.trim()) { setFiltered(tatuadores); return }
    const q = query.toLowerCase()
    setFiltered(tatuadores.filter(t =>
      t.nombre?.toLowerCase().includes(q) ||
      t.username?.toLowerCase().includes(q) ||
      t.ciudad?.toLowerCase().includes(q)
    ))
  }, [query, tatuadores])

  const saveTipo = async (tipo: string) => {
    setSavingTipo(true)
    setTipoCuenta(tipo)
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await supabase.from('users').update({ tipo_cuenta: tipo }).eq('id', session.user.id)
    }
    setSavingTipo(false)
    setStep(1)
  }

  const toggleFollow = async (userId: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const isNow = followed.has(userId)
    const next = new Set(followed)

    if (isNow) {
      next.delete(userId)
      await supabase.from('user_follows')
        .delete()
        .eq('follower_id', session.user.id)
        .eq('following_id', userId)
    } else {
      next.add(userId)
      await supabase.from('user_follows')
        .insert({ follower_id: session.user.id, following_id: userId })
    }
    setFollowed(next)
  }

  const continuar = async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (tipoCuenta === 'tatuador' || tipoCuenta === 'estudio') {
      setStep(2)
    } else {
      await finish(session?.user?.id)
    }
  }

  const finish = async (userId?: string) => {
    setFinishing(true)
    if (userId) {
      await supabase
        .from('users')
        .update({ onboarding_done: true })
        .eq('id', userId)
    }
    localStorage.removeItem('tipo_cuenta')
    router.push('/galeria')
  }

  const handleFinish = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    await finish(session?.user?.id)
  }

  /* ── PASO 0: elegir tipo de cuenta (solo usuarios Google) ── */
  if (step === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">¿Cómo vas a usar la app?</h1>
          <p className="text-sm text-gray-500 mb-8">Esto personaliza tu experiencia. Puedes cambiarlo después.</p>
          <div className="flex flex-col gap-3">
            {[
              { tipo: 'tatuador', label: 'Soy tatuador', desc: 'Sube tu trabajo y consigue clientes' },
              { tipo: 'estudio', label: 'Tengo un estudio', desc: 'Perfil de estudio con varios artistas' },
              { tipo: 'inspiracion', label: 'Busco inspiración', desc: 'Solo quiero descubrir tatuajes' },
            ].map(({ tipo, label, desc }) => (
              <button
                key={tipo}
                onClick={() => saveTipo(tipo)}
                disabled={savingTipo}
                className="w-full text-left px-5 py-4 border-2 border-gray-100 rounded-2xl hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                <p className="font-medium text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ── PASO 1 ── */
  if (step === 1) {
    return (
      <div className="min-h-screen bg-white pb-32">
        <div className="max-w-2xl mx-auto px-4 pt-10">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Personaliza tu feed</h1>
          <p className="text-sm text-gray-500 mb-6">
            Sigue a tatuadores para ver su trabajo en tu feed diario
          </p>

          {/* Buscador */}
          <div className="relative mb-6">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar tatuador..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
            />
          </div>

          {/* Grid de tatuadores */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map(t => {
              const isFollowing = followed.has(t.id)
              return (
                <div
                  key={t.id}
                  className={`relative rounded-2xl border-2 p-4 transition-all cursor-pointer ${
                    isFollowing ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                  }`}
                  onClick={() => toggleFollow(t.id)}
                >
                  {isFollowing && (
                    <CheckCircle size={16} className="absolute top-3 right-3 text-gray-900" />
                  )}
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden shrink-0">
                      {t.avatar ? (
                        <Image
                          src={t.avatar}
                          alt=""
                          width={56}
                          height={56}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-semibold text-gray-400">
                          {t.nombre?.[0]?.toUpperCase() ?? '?'}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 leading-tight line-clamp-1">
                        {t.nombre ?? t.username}
                      </p>
                      {t.ciudad && (
                        <p className="text-xs text-gray-400 mt-0.5">{t.ciudad}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">{t.photo_count} fotos</p>
                    </div>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <p className="col-span-2 sm:col-span-3 text-center text-sm text-gray-400 py-8">
                No se encontraron resultados
              </p>
            )}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 safe-area-inset-bottom">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <button
              onClick={() => finish(undefined).then(() => {})}
              disabled={finishing}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Saltar por ahora
            </button>
            <button
              onClick={continuar}
              disabled={finishing}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-2xl hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Continuar{followed.size > 0 ? ` (${followed.size} seguidos)` : ''}
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── PASO 2 (tatuadores/estudios) ── */
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🎨</span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Tu perfil está listo</h1>
        <p className="text-sm text-gray-500 mb-8">
          Sube tus primeros tatuajes para aparecer en el feed de tus seguidores
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => { handleFinish(); router.push('/upload') }}
            className="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-2xl hover:bg-gray-700 transition-colors"
          >
            Subir fotos ahora
          </button>
          <button
            onClick={handleFinish}
            disabled={finishing}
            className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Después
          </button>
        </div>
      </div>
    </div>
  )
}
