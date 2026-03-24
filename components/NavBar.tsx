'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Upload, Menu, X, LogOut, User } from 'lucide-react'
import { useAuth } from './AuthContext'

export default function NavBar() {
  const { user, signOut, openAuthModal } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const avatarLetter = user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-semibold tracking-tight text-gray-900">
              tattoos<span className="font-light">fineline</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link href="/" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              Galería
            </Link>
            <Link href="/explorar" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              Explorar
            </Link>
            {user && (
              <Link href="/guardar" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                Guardados
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/upload"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Upload size={15} />
                  Subir foto
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
                      <div className="absolute right-0 top-11 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 w-44 z-50">
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
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                >
                  Entrar
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Registrarse
                </button>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-gray-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          <Link href="/" className="block px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
            Galería
          </Link>
          <Link href="/explorar" className="block px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
            Explorar
          </Link>
          {user ? (
            <>
              <Link href="/guardar" className="block px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                Guardados
              </Link>
              <Link href="/upload" className="block px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg text-center mt-2" onClick={() => setMenuOpen(false)}>
                Subir foto
              </Link>
              <button
                onClick={() => { signOut(); setMenuOpen(false) }}
                className="block w-full px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50 text-left mt-1"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { openAuthModal('login'); setMenuOpen(false) }}
                className="block w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 text-left"
              >
                Entrar
              </button>
              <button
                onClick={() => { openAuthModal('register'); setMenuOpen(false) }}
                className="block w-full px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg text-center mt-2"
              >
                Registrarse
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
