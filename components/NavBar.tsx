'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Heart, BookmarkCheck, Upload, Menu, X } from 'lucide-react'

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-semibold tracking-tight text-gray-900">
              tattoos<span className="font-light">fineline</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Galería
            </Link>
            <Link
              href="/explorar"
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Explorar
            </Link>
            <Link
              href="/guardar"
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Guardados
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/upload"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Upload size={15} />
              Subir foto
            </Link>
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
          <Link href="/guardar" className="block px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
            Guardados
          </Link>
          <Link href="/upload" className="block px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg text-center mt-2" onClick={() => setMenuOpen(false)}>
            Subir foto
          </Link>
        </div>
      )}
    </nav>
  )
}
