'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export default function LandingSearch() {
  const [value, setValue] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = value.trim()
    router.push(q ? `/galeria?q=${encodeURIComponent(q)}` : '/galeria')
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Busca: floral, luna, mariposa, brazo..."
        className="w-full pl-12 pr-24 py-4 bg-white border border-gray-200 rounded-2xl text-base text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:border-gray-400 transition-colors"
        autoFocus
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
      >
        Buscar
      </button>
    </form>
  )
}
