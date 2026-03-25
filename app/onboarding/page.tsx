'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('Onboarding')

  const [step, setStep]             = useState(0)
  const [tatuadores, setTatuadores] = useState<Tatuador[]>([])
  const [filtered, setFiltered]     = useState<Tatuador[]>([])
  const [followed, setFollowed]     = useState<Set<string>>(new Set())
  const [query, setQuery]           = useState('')
  const [tipoCuenta, setTipoCuenta] = useState<string>('inspiracion')
  const [finishing, setFinishing]   = useState(false)
  const [savingTipo, setSavingTipo] = useState(false)

  useEffect(() => {
    const tipo = localStorage.getItem('tipo_cuenta')
    if (tipo) {
      setTipoCuenta(tipo)
      setStep(1)
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) return
        supabase.from('users').select('tipo_cuenta').eq('id', session.user.id).single()
          .then(({ data }) => {
            const dbTipo = data?.tipo_cuenta
            if (dbTipo && dbTipo !== 'inspiracion') {
              setTipoCuenta(dbTipo)
              setStep(1)
            }
          })
      })
    }

    async function fetchTatuadores() {
      const { data } = await supabase
        .from('users')
        .select('id, nombre, username, avatar, ciudad, tipo_cuenta, followers_count')
        .in('tipo_cuenta', ['tatuador', 'estudio'])
        .order('followers_count', { ascending: false })
        .limit(24)

      if (!data) return
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
      await supabase.from('users').update({ onboarding_done: true }).eq('id', userId)
    }
    localStorage.removeItem('tipo_cuenta')
    router.push('/galeria')
  }

  const handleFinish = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    await finish(session?.user?.id)
  }

  /* ── PASO 0 ── */
  if (step === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">{t('step0Title')}</h1>
          <p className="text-sm text-gray-500 mb-8">{t('step0Subtitle')}</p>
          <div className="flex flex-col gap-3">
            {[
              { tipo: 'tatuador',    label: t('opt1Label'), desc: t('opt1Desc') },
              { tipo: 'estudio',     label: t('opt2Label'), desc: t('opt2Desc') },
              { tipo: 'inspiracion', label: t('opt3Label'), desc: t('opt3Desc') },
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
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">{t('step1Title')}</h1>
          <p className="text-sm text-gray-500 mb-6">{t('step1Subtitle')}</p>

          <div className="relative mb-6">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map(tatuador => {
              const isFollowing = followed.has(tatuador.id)
              return (
                <div
                  key={tatuador.id}
                  className={`relative rounded-2xl border-2 p-4 transition-all cursor-pointer ${
                    isFollowing ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                  }`}
                  onClick={() => toggleFollow(tatuador.id)}
                >
                  {isFollowing && (
                    <CheckCircle size={16} className="absolute top-3 right-3 text-gray-900" />
                  )}
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden shrink-0">
                      {tatuador.avatar ? (
                        <Image src={tatuador.avatar} alt="" width={56} height={56} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-semibold text-gray-400">
                          {tatuador.nombre?.[0]?.toUpperCase() ?? '?'}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 leading-tight line-clamp-1">
                        {tatuador.nombre ?? tatuador.username}
                      </p>
                      {tatuador.ciudad && (
                        <p className="text-xs text-gray-400 mt-0.5">{tatuador.ciudad}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">{tatuador.photo_count} {t('photos')}</p>
                    </div>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <p className="col-span-2 sm:col-span-3 text-center text-sm text-gray-400 py-8">
                {t('noResults')}
              </p>
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 safe-area-inset-bottom">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <button
              onClick={() => finish(undefined).then(() => {})}
              disabled={finishing}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t('skip')}
            </button>
            <button
              onClick={continuar}
              disabled={finishing}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-2xl hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {followed.size > 0 ? t('continueFollowing', { n: followed.size }) : t('continue')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── PASO 2 ── */
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🎨</span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">{t('step2Title')}</h1>
        <p className="text-sm text-gray-500 mb-8">{t('step2Subtitle')}</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => { handleFinish(); router.push('/upload') }}
            className="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-2xl hover:bg-gray-700 transition-colors"
          >
            {t('uploadNow')}
          </button>
          <button
            onClick={handleFinish}
            disabled={finishing}
            className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            {t('later')}
          </button>
        </div>
      </div>
    </div>
  )
}
