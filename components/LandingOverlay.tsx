'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useAuth } from './AuthContext'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Props = { totalFotos: number }

export default function LandingOverlay({ totalFotos }: Props) {
  const { user, openAuthModal } = useAuth()
  const [visible, setVisible] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!user && !sessionStorage.getItem('guest')) {
      setVisible(true)
    }
  }, [user])

  // Also hide when user logs in
  useEffect(() => {
    if (user) setVisible(false)
  }, [user])

  const handleGuest = () => {
    sessionStorage.setItem('guest', '1')
    setVisible(false)
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred gallery background */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Close / View as guest */}
      <button
        onClick={handleGuest}
        className="absolute top-5 right-5 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Ver sin registrarse"
      >
        <X size={20} />
      </button>

      {/* Content card */}
      <div className="relative z-10 text-center w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            tattoos<span className="font-extralight">fineline</span>
          </h1>
          <p className="text-lg text-white/70 mt-2 font-light">
            Tu inspiración fine line, cada día
          </p>
        </div>

        <p className="text-sm text-white/50 mb-8 leading-relaxed">
          Descubre{' '}
          <span className="text-white/80 font-medium">{totalFotos.toLocaleString()} tatuajes</span>{' '}
          de línea fina. Guárdalos, organízalos y comparte los tuyos.
        </p>

        <div className="space-y-3">
          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full py-3.5 bg-white text-gray-900 font-semibold rounded-2xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 shadow-lg"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          {/* Email login */}
          <button
            onClick={() => { openAuthModal('login'); setVisible(false) }}
            className="w-full py-3 bg-white/10 text-white font-medium rounded-2xl hover:bg-white/20 transition-colors border border-white/20"
          >
            Entrar con email
          </button>

          {/* Register */}
          <button
            onClick={() => { openAuthModal('register'); setVisible(false) }}
            className="w-full py-3 bg-white/5 text-white/80 font-medium rounded-2xl hover:bg-white/10 transition-colors border border-white/10 text-sm"
          >
            Crear cuenta — Es gratis
          </button>
        </div>

        <button
          onClick={handleGuest}
          className="mt-5 text-sm text-white/30 hover:text-white/60 transition-colors"
        >
          Ver galería sin registrarse →
        </button>
      </div>
    </div>
  )
}
