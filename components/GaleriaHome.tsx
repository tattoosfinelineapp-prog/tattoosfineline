'use client'

import { useState, useMemo } from 'react'
import GaleriaGrid from './GaleriaGrid'
import Buscador from './Buscador'
import type { Tattoo } from '@/lib/data'

export default function GaleriaHome({ tattoos }: { tattoos: Tattoo[] }) {
  const [busqueda, setBusqueda] = useState('')

  const tattoosFiltrados = useMemo(() => {
    if (!busqueda) return tattoos
    const q = busqueda.toLowerCase()
    return tattoos.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.motivo.toLowerCase().includes(q) ||
      t.zona.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q)) ||
      t.tatuador.toLowerCase().includes(q)
    )
  }, [busqueda, tattoos])

  return (
    <>
      <div className="max-w-xl mx-auto mb-8">
        <Buscador value={busqueda} onChange={setBusqueda} />
      </div>
      <GaleriaGrid tattoos={tattoosFiltrados} />
    </>
  )
}
