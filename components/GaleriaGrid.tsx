'use client'

import { useMemo } from 'react'
import TattooCard from './TattooCard'
import type { Tattoo } from '@/lib/data'

type Props = {
  tattoos: Tattoo[]
}

export default function GaleriaGrid({ tattoos }: Props) {
  const columns = useMemo(() => {
    const cols: Tattoo[][] = [[], [], [], []]
    tattoos.forEach((t, i) => {
      cols[i % 4].push(t)
    })
    return cols
  }, [tattoos])

  const columnsMobile = useMemo(() => {
    const cols: Tattoo[][] = [[], []]
    tattoos.forEach((t, i) => {
      cols[i % 2].push(t)
    })
    return cols
  }, [tattoos])

  if (tattoos.length === 0) {
    return (
      <div className="text-center py-24 text-gray-400">
        <p className="text-lg">No se encontraron tatuajes</p>
        <p className="text-sm mt-1">Prueba con otros filtros</p>
      </div>
    )
  }

  return (
    <>
      <div className="hidden md:flex gap-3">
        {columns.map((col, ci) => (
          <div key={ci} className="flex-1 flex flex-col gap-3">
            {col.map(tattoo => (
              <TattooCard key={tattoo.id} tattoo={tattoo} />
            ))}
          </div>
        ))}
      </div>

      <div className="flex md:hidden gap-3">
        {columnsMobile.map((col, ci) => (
          <div key={ci} className="flex-1 flex flex-col gap-3">
            {col.map(tattoo => (
              <TattooCard key={tattoo.id} tattoo={tattoo} />
            ))}
          </div>
        ))}
      </div>
    </>
  )
}
