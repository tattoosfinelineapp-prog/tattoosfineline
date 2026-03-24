'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { useAuth } from './AuthContext'

export default function CtaBanner() {
  const { user } = useAuth()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (user && !localStorage.getItem('cta_v1')) {
      setVisible(true)
    }
  }, [user])

  const dismiss = () => {
    localStorage.setItem('cta_v1', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <p className="text-sm">
          <strong>¿Tienes tatuajes fine line?</strong>{' '}
          <span className="text-gray-300">Compártelos con la comunidad.</span>{' '}
          <Link href="/upload" className="text-white underline underline-offset-2 hover:no-underline">
            Subir fotos →
          </Link>
        </p>
        <button
          onClick={dismiss}
          className="shrink-0 text-gray-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
