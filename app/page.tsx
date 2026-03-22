'use client'

import { useState, useMemo } from 'react'
import GaleriaGrid from '@/components/GaleriaGrid'
import Buscador from '@/components/Buscador'
import { tattoosSample } from '@/lib/data'

export default function Home() {
  const [busqueda, setBusqueda] = useState('')

  const tattoosFiltrados = useMemo(() => {
    if (!busqueda) return tattoosSample
    const q = busqueda.toLowerCase()
    return tattoosSample.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.motivo.toLowerCase().includes(q) ||
      t.zona.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q)) ||
      t.tatuador.toLowerCase().includes(q)
    )
  }, [busqueda])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-2">
          Galería fine line
        </h1>
        <p className="text-gray-400 text-base">
          {tattoosSample.length} tatuajes · actualizado hoy
        </p>
      </div>

      <div className="max-w-xl mx-auto mb-8">
        <Buscador value={busqueda} onChange={setBusqueda} />
      </div>

      <GaleriaGrid tattoos={tattoosFiltrados} />
    </div>
  )
}
