'use client'

import { useState, useMemo } from 'react'
import GaleriaGrid from './GaleriaGrid'
import FiltrosBar from './FiltrosBar'
import Buscador from './Buscador'
import type { Tattoo } from '@/lib/data'
import { SlidersHorizontal, ChevronDown } from 'lucide-react'

export default function ExplorarClient({ tattoos }: { tattoos: Tattoo[] }) {
  const [busqueda, setBusqueda] = useState('')
  const [filtrosOpen, setFiltrosOpen] = useState(true)
  const [filtros, setFiltros] = useState({ motivo: '', zona: '', tamaño: '' })

  const tattoosFiltrados = useMemo(() => {
    return tattoos.filter(t => {
      const matchBusqueda = !busqueda || (
        t.title.toLowerCase().includes(busqueda.toLowerCase()) ||
        t.motivo.toLowerCase().includes(busqueda.toLowerCase()) ||
        t.zona.toLowerCase().includes(busqueda.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(busqueda.toLowerCase()))
      )
      const matchMotivo = !filtros.motivo || t.motivo === filtros.motivo
      const matchZona = !filtros.zona || t.zona === filtros.zona
      const matchTamaño = !filtros.tamaño || t.tamaño === filtros.tamaño
      return matchBusqueda && matchMotivo && matchZona && matchTamaño
    })
  }, [busqueda, filtros, tattoos])

  const activeFiltersCount = [filtros.motivo, filtros.zona, filtros.tamaño].filter(Boolean).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Explorar</h1>
        <Buscador value={busqueda} onChange={setBusqueda} />
      </div>

      <div className="mb-6">
        <button
          onClick={() => setFiltrosOpen(!filtrosOpen)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          <SlidersHorizontal size={16} />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="bg-gray-900 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDown
            size={16}
            className={`transition-transform ${filtrosOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {filtrosOpen && (
          <div className="mt-4 p-4 bg-gray-50 rounded-2xl">
            <FiltrosBar filtros={filtros} onChange={setFiltros} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">
          {tattoosFiltrados.length} resultado{tattoosFiltrados.length !== 1 ? 's' : ''}
        </p>
      </div>

      <GaleriaGrid tattoos={tattoosFiltrados} />
    </div>
  )
}
