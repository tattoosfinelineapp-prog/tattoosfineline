'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Search, X, Upload, Menu, LogOut, User } from 'lucide-react'
import { useAuth } from './AuthContext'
import { useSearch } from './SearchContext'
import { usePathname } from 'next/navigation'

const SUGERENCIAS = [
  'floral', 'minimalista', 'geométrico', 'luna', 'mariposa',
  'rosa', 'animales', 'letras', 'brazo', 'tobillo',
]

export default function NavBar() {
  const { user, signOut, openAuthModal } = useAuth()
  const { busqueda, setBusqueda } = useSearch()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const avatarLetter = user?.email?.[0]?.toUpperCase() ?? '?'
  const showSugerencias = searchFocused && !busqueda

  // Reset search when navigating away from home
  useEffect(() => {
    if (pathname !== '/') setBusqueda('')
  }, [pathname, setBusqueda])

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main row */}
        <div className="flex items-center gap-3 h-16">
          {/* Logo */}
          <Link href="/" className="shrink-0 mr-1" onClick={() => setBusqueda('')}>
            <span className="text-lg font-semibold tracking-tight text-gray-900 whitespace-nowrap">
              tattoos<span className="font-light">fineline</span>
            </span>
          </Link>

          {/* Search — central, large */}
          <div className="relative flex-1 max-w-2xl mx-auto hidden sm:block">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
            />
            <input
              ref={inputRef}
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              placeholder="Busca tatuajes fine line: floral, luna, mariposa..."
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 rounded-2xl text-sm text-gray-800 placeholder-gray-400 border border-transparent focus:outline-none focus:border-gray-200 focus:bg-white transition-all"
            />
            {busqueda && (
              <button
                onClick={() => { setBusqueda(''); inputRef.current?.focus() }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            )}

            {/* Sugerencias dropdown */}
            {showSugerencias && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-lg border border-gray-100 py-3 z-50">
                <p className="text-xs text-gray-400 px-4 mb-2">Búsquedas populares</p>
                <div className="flex flex-wrap gap-2 px-4">
                  {SUGERENCIAS.map(s => (
                    <button
                      key={s}
                      onMouseDown={() => setBusqueda(s)}
                      className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-sm text-gray-700 rounded-full transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Auth / User — right */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {user ? (
              <>
                <Link
                  href="/upload"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors"
                >
                  <Upload size={15} />
                  Subir
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="w-9 h-9 rounded-full bg-gray-900 text-white text-sm font-semibold flex items-center justify-center hover:bg-gray-700 transition-colors"
                  >
                    {avatarLetter}
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-11 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 w-48 z-50">
                        <p className="px-4 py-2 text-xs text-gray-400 truncate">{user.email}</p>
                        <hr className="my-1 border-gray-100" />
                        <Link
                          href={`/perfil/${user.id}`}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User size={14} />
                          Mi perfil
                        </Link>
                        <Link
                          href="/guardar"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Guardados
                        </Link>
                        <hr className="my-1 border-gray-100" />
                        <button
                          onClick={() => { signOut(); setUserMenuOpen(false) }}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                        >
                          <LogOut size={14} />
                          Cerrar sesión
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                >
                  Entrar
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Registrarse
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden ml-auto p-2 rounded-lg text-gray-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile search row */}
        <div className="sm:hidden pb-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Busca tatuajes..."
              className="w-full pl-9 pr-8 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:border-gray-200 focus:bg-white border border-transparent transition-all"
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {user ? (
            <>
              <Link href="/upload" className="block px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl text-center" onClick={() => setMenuOpen(false)}>
                Subir foto
              </Link>
              <Link href={`/perfil/${user.id}`} className="block px-3 py-2 text-sm text-gray-700 rounded-xl hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                Mi perfil
              </Link>
              <Link href="/guardar" className="block px-3 py-2 text-sm text-gray-700 rounded-xl hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                Guardados
              </Link>
              <button onClick={() => { signOut(); setMenuOpen(false) }} className="block w-full px-3 py-2 text-sm text-gray-600 rounded-xl hover:bg-gray-50 text-left">
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { openAuthModal('login'); setMenuOpen(false) }} className="block w-full px-3 py-2 text-sm text-gray-700 rounded-xl hover:bg-gray-50 text-left">
                Entrar
              </button>
              <button onClick={() => { openAuthModal('register'); setMenuOpen(false) }} className="block w-full px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl text-center">
                Registrarse
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
