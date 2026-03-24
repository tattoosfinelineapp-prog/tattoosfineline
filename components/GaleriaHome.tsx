'use client'

import { useMemo } from 'react'
import GaleriaGrid from './GaleriaGrid'
import { useSearch } from './SearchContext'
import type { Tattoo } from '@/lib/data'

export default function GaleriaHome({ tattoos }: { tattoos: Tattoo[] }) {
  const { busqueda } = useSearch()

  const tattoosFiltrados = useMemo(() => {
    if (!busqueda) return tattoos
    const q = busqueda.toLowerCase()
    return tattoos.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.motivo.toLowerCase().includes(q) ||
      t.zona.toLowerCase().includes(q) ||
      t.alt_text.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q)) ||
      t.tatuador.toLowerCase().includes(q)
    )
  }, [busqueda, tattoos])

  if (busqueda && tattoosFiltrados.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-lg font-medium text-gray-700">No encontramos &ldquo;{busqueda}&rdquo;</p>
        <p className="text-sm mt-1">Prueba con: floral, luna, mariposa, brazo...</p>
      </div>
    )
  }

  return <GaleriaGrid tattoos={tattoosFiltrados} />
}
