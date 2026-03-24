'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { X, Mail, Lock, User, MapPin, Instagram } from 'lucide-react'

type TipoCuenta = 'tatuador' | 'estudio' | 'inspiracion'
type RegStep = 'type' | 'form'

type Props = {
  mode: 'login' | 'register'
  onClose: () => void
  onSwitchMode: (mode: 'login' | 'register') => void
}

const TIPOS: { id: TipoCuenta; emoji: string; titulo: string; desc: string }[] = [
  { id: 'tatuador',    emoji: '🎨', titulo: 'Tatuador',    desc: 'Sube todo tu trabajo fine line al mundo' },
  { id: 'estudio',     emoji: '🏠', titulo: 'Estudio',     desc: 'Muestra el trabajo de todo tu estudio' },
  { id: 'inspiracion', emoji: '💫', titulo: 'Inspiración', desc: 'Encuentra ideas para tu próximo tatuaje' },
]

export default function AuthModal({ mode, onClose, onSwitchMode }: Props) {
  const supabase = createClientComponentClient()
  const [regStep, setRegStep] = useState<RegStep>('type')
  const [tipoCuenta, setTipoCuenta] = useState<TipoCuenta>('inspiracion')

  // Form fields
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [nombre, setNombre]         = useState('')
  const [ciudad, setCiudad]         = useState('')
  const [instagram, setInstagram]   = useState('')
  const [nombreEstudio, setNombreEstudio] = useState('')
  const [direccion, setDireccion]   = useState('')
  const [web, setWeb]               = useState('')
  const [consent, setConsent]       = useState(false)

  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!consent) { setError('Debes aceptar los términos'); return }
    setLoading(true); setError('')

    const metadata = {
      nombre: tipoCuenta === 'estudio' ? nombreEstudio : nombre,
      tipo_cuenta: tipoCuenta,
      ciudad,
      instagram: instagram.replace('@', ''),
      nombre_estudio: tipoCuenta === 'estudio' ? nombreEstudio : undefined,
      direccion: tipoCuenta === 'estudio' ? direccion : undefined,
      web: tipoCuenta === 'estudio' ? web : undefined,
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: { data: metadata },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Also upsert extra fields into users table (trigger handles basics)
    if (data.user) {
      await supabase.from('users').upsert({
        id: data.user.id,
        tipo_cuenta: tipoCuenta,
        nombre: metadata.nombre,
        ciudad: ciudad || null,
        instagram: metadata.instagram || null,
        nombre_estudio: metadata.nombre_estudio || null,
        direccion: metadata.direccion || null,
        web: metadata.web || null,
      }).eq('id', data.user.id)
    }

    // Send welcome email (fire and forget — logs to Vercel Functions console)
    const displayName = tipoCuenta === 'estudio' ? nombreEstudio : nombre
    fetch('/api/emails/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, nombre: displayName, tipo_cuenta: tipoCuenta }),
    })
      .then(r => r.json().then(d => console.log('[welcome-email] result:', r.status, d)))
      .catch(e => console.error('[welcome-email] fetch error:', e))

    setSuccess('Revisa tu email para confirmar tu cuenta ✉️')
    setLoading(false)
  }

  const isWide = mode === 'register' && regStep === 'type'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-3xl shadow-xl w-full mx-auto transition-all duration-200 ${
        isWide ? 'max-w-xl' : 'max-w-sm'
      }`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X size={18} className="text-gray-500" />
        </button>

        {/* ── LOGIN ─────────────────────────────── */}
        {mode === 'login' && (
          <div className="p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Iniciar sesión</h2>
            <p className="text-sm text-gray-400 mb-6">Bienvenido de vuelta</p>

            <form onSubmit={handleLogin} className="space-y-3">
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full pl-9 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all" />
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full pl-9 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all" />
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50">
                {loading ? 'Cargando...' : 'Entrar'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-5">
              ¿No tienes cuenta?{' '}
              <button onClick={() => onSwitchMode('register')} className="text-gray-900 font-medium hover:underline">
                Regístrate
              </button>
            </p>
          </div>
        )}

        {/* ── REGISTRO: elegir tipo ─────────────── */}
        {mode === 'register' && regStep === 'type' && (
          <div className="p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-1 pr-8">Crear cuenta</h2>
            <p className="text-sm text-gray-400 mb-6">¿Cómo usarás tattoosfineline?</p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {TIPOS.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTipoCuenta(t.id); setRegStep('form') }}
                  className="flex flex-col items-center text-center p-4 rounded-2xl border-2 border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                >
                  <span className="text-3xl mb-3">{t.emoji}</span>
                  <p className="text-sm font-semibold text-gray-900 mb-1">{t.titulo}</p>
                  <p className="text-xs text-gray-400 leading-snug">{t.desc}</p>
                </button>
              ))}
            </div>

            <p className="text-center text-sm text-gray-400">
              ¿Ya tienes cuenta?{' '}
              <button onClick={() => onSwitchMode('login')} className="text-gray-900 font-medium hover:underline">
                Inicia sesión
              </button>
            </p>
          </div>
        )}

        {/* ── REGISTRO: formulario ──────────────── */}
        {mode === 'register' && regStep === 'form' && (
          <div className="p-8">
            <button
              onClick={() => setRegStep('type')}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-5 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              {TIPOS.find(t => t.id === tipoCuenta)?.emoji}{' '}
              {TIPOS.find(t => t.id === tipoCuenta)?.titulo}
            </button>

            <h2 className="text-xl font-semibold text-gray-900 mb-5">Tus datos</h2>

            <form onSubmit={handleRegister} className="space-y-3">
              {/* Nombre */}
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={tipoCuenta === 'estudio' ? 'Nombre del estudio' : tipoCuenta === 'tatuador' ? 'Nombre artístico' : 'Tu nombre'}
                  value={tipoCuenta === 'estudio' ? nombreEstudio : nombre}
                  onChange={e => tipoCuenta === 'estudio' ? setNombreEstudio(e.target.value) : setNombre(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                />
              </div>

              {/* Email + password */}
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full pl-9 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all" />
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" placeholder="Contraseña (mín. 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                  className="w-full pl-9 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all" />
              </div>

              {/* Campos extra según tipo */}
              {(tipoCuenta === 'tatuador' || tipoCuenta === 'estudio') && (
                <>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Ciudad (opcional)" value={ciudad} onChange={e => setCiudad(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all" />
                  </div>
                  <div className="relative">
                    <Instagram size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="@instagram (opcional)" value={instagram} onChange={e => setInstagram(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all" />
                  </div>
                </>
              )}
              {tipoCuenta === 'estudio' && (
                <div className="relative">
                  <input type="text" placeholder="Dirección (opcional)" value={direccion} onChange={e => setDireccion(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all" />
                </div>
              )}

              {/* Consentimiento */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-gray-900 shrink-0" />
                <span className="text-xs text-gray-500 leading-relaxed">
                  Acepto los{' '}
                  <a href="/terminos" target="_blank" className="text-gray-900 underline">Términos de uso</a>
                  {' '}y la{' '}
                  <a href="/privacidad" target="_blank" className="text-gray-900 underline">Política de privacidad</a>
                </span>
              </label>

              {error   && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
              {success && <p className="text-sm text-green-600 bg-green-50 rounded-xl px-3 py-2">{success}</p>}

              <button type="submit" disabled={loading || !consent}
                className="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50">
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-5">
              ¿Ya tienes cuenta?{' '}
              <button onClick={() => onSwitchMode('login')} className="text-gray-900 font-medium hover:underline">
                Inicia sesión
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
