'use client'

import TattooCard from './TattooCard'
import type { Tattoo } from '@/lib/data'

export default function GaleriaGrid({ tattoos }: { tattoos: Tattoo[] }) {
  if (tattoos.length === 0) {
    return (
      <div className="text-center py-24 text-gray-400">
        <p className="text-lg">No se encontraron tatuajes</p>
        <p className="text-sm mt-1">Prueba con otros filtros</p>
      </div>
    )
  }

  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-2">
      {tattoos.map(tattoo => (
        <div key={tattoo.id} className="break-inside-avoid mb-2">
          <TattooCard tattoo={tattoo} />
        </div>
      ))}
    </div>
  )
}
