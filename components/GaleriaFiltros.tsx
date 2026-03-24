'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const FILTROS = [
  { label: 'Todos', value: '' },
  { label: 'Floral', value: 'floral' },
  { label: 'Luna', value: 'luna' },
  { label: 'Letras', value: 'letras' },
  { label: 'Animales', value: 'animales' },
  { label: 'Geométrico', value: 'geometrico' },
  { label: 'Minimalista', value: 'minimalista' },
  { label: 'Mariposa', value: 'mariposa' },
  { label: 'Mandala', value: 'mandala' },
  { label: 'Serpiente', value: 'serpiente' },
  { label: 'Rosa', value: 'rosa' },
]

export default function GaleriaFiltros() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentQ = (searchParams.get('q') ?? '').toLowerCase()

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
      {FILTROS.map(f => {
        const isActive = f.value === '' ? !currentQ : currentQ === f.value
        return (
          <button
            key={f.value}
            onClick={() =>
              router.push(f.value ? `/galeria?q=${f.value}` : '/galeria', { scroll: false })
            }
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              isActive
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        )
      })}
    </div>
  )
}
