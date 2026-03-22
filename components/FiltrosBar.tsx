'use client'

import { MOTIVOS, ZONAS, TAMAÑOS } from '@/lib/data'

type Filtros = {
  motivo: string
  zona: string
  tamaño: string
}

type Props = {
  filtros: Filtros
  onChange: (filtros: Filtros) => void
}

export default function FiltrosBar({ filtros, onChange }: Props) {
  const set = (key: keyof Filtros, value: string) => {
    onChange({ ...filtros, [key]: filtros[key] === value ? '' : value })
  }

  const chipClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
      active
        ? 'bg-gray-900 text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Motivo</p>
        <div className="flex flex-wrap gap-2">
          {MOTIVOS.map(m => (
            <button
              key={m}
              onClick={() => set('motivo', m)}
              className={chipClass(filtros.motivo === m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Zona</p>
        <div className="flex flex-wrap gap-2">
          {ZONAS.map(z => (
            <button
              key={z}
              onClick={() => set('zona', z)}
              className={chipClass(filtros.zona === z)}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Tamaño</p>
        <div className="flex flex-wrap gap-2">
          {TAMAÑOS.map(t => (
            <button
              key={t}
              onClick={() => set('tamaño', t)}
              className={chipClass(filtros.tamaño === t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {(filtros.motivo || filtros.zona || filtros.tamaño) && (
        <button
          onClick={() => onChange({ motivo: '', zona: '', tamaño: '' })}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
