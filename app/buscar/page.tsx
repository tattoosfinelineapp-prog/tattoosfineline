'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Search, User, Folder, ImageIcon } from 'lucide-react'
import type { Tattoo } from '@/lib/data'
import type { UserProfile, CarpetaPublica } from '@/lib/queries'

type Tab = 'fotos' | 'tatuadores' | 'estudios' | 'carpetas'

type SearchResults = {
  fotos: Tattoo[]
  tatuadores: UserProfile[]
  estudios: UserProfile[]
  carpetas: CarpetaPublica[]
}

function UserCard({ user }: { user: UserProfile }) {
  const nombre = user.tipo_cuenta === 'estudio'
    ? (user.nombre_estudio ?? user.nombre)
    : user.nombre

  return (
    <Link href={`/perfil/${user.username ?? user.id}`}>
      <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-gray-100">
        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0">
          {user.avatar ? (
            <Image src={user.avatar} alt={nombre ?? ''} width={48} height={48} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-lg font-semibold text-gray-400">
                {(nombre ?? user.email)[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-gray-900 truncate text-sm">{nombre ?? user.email.split('@')[0]}</p>
            {user.tipo_cuenta === 'tatuador' && (
              <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full shrink-0 font-medium">Tatuador</span>
            )}
            {user.tipo_cuenta === 'estudio' && (
              <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full shrink-0 font-medium">Estudio</span>
            )}
          </div>
          {user.username && <p className="text-xs text-gray-400">@{user.username}</p>}
          {user.ciudad && <p className="text-xs text-gray-400">{user.ciudad}</p>}
        </div>
      </div>
    </Link>
  )
}

function CarpetaCard({ carpeta }: { carpeta: CarpetaPublica }) {
  return (
    <Link href={`/tablero/${carpeta.id}`}>
      <div className="p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <Folder size={16} className="text-gray-400 shrink-0" />
          <p className="font-medium text-gray-900 text-sm truncate">{carpeta.nombre}</p>
        </div>
        {carpeta.tags_default && carpeta.tags_default.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {carpeta.tags_default.slice(0, 4).map(tag => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        )}
        {carpeta.users?.nombre && (
          <p className="text-xs text-gray-400 mt-1.5">por {carpeta.users.nombre}</p>
        )}
      </div>
    </Link>
  )
}

function FotoGrid({ fotos }: { fotos: Tattoo[] }) {
  if (!fotos.length) return null
  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 gap-2">
      {fotos.map(foto => (
        <div key={foto.id} className="break-inside-avoid mb-2">
          <Link href={`/tattoo/${foto.id}`}>
            <div className="rounded-xl overflow-hidden bg-gray-100 group">
              <Image
                src={foto.url}
                alt={foto.alt_text || foto.title}
                width={400}
                height={foto.height || 350}
                className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.02]"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading="lazy"
              />
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
}

function BuscarContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) ?? 'fotos')
  const [results, setResults] = useState<SearchResults>({ fotos: [], tatuadores: [], estudios: [], carpetas: [] })
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = async (q: string) => {
    if (!q.trim()) {
      setResults({ fotos: [], tatuadores: [], estudios: [], carpetas: [] })
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/buscar?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data)
    } catch {
      // ignore
    }
    setLoading(false)
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doSearch(query)
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      params.set('tab', activeTab)
      router.replace(`/buscar?${params.toString()}`, { scroll: false })
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    params.set('tab', activeTab)
    router.replace(`/buscar?${params.toString()}`, { scroll: false })
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const q = searchParams.get('q') ?? ''
    if (q) { setQuery(q); doSearch(q) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'fotos',      label: 'Fotos',      icon: <ImageIcon size={14} />,  count: results.fotos.length },
    { id: 'tatuadores', label: 'Tatuadores', icon: <User size={14} />,       count: results.tatuadores.length },
    { id: 'estudios',   label: 'Estudios',   icon: <User size={14} />,       count: results.estudios.length },
    { id: 'carpetas',   label: 'Carpetas',   icon: <Folder size={14} />,     count: results.carpetas.length },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20">
      {/* Search input */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar tatuajes, tatuadores, estudios..."
          autoFocus
          className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto scrollbar-none">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {tab.icon}
            {tab.label}
            {query && tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200 text-gray-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && query && !results.fotos.length && !results.tatuadores.length && !results.estudios.length && !results.carpetas.length && (
        <div className="text-center py-16">
          <Search size={32} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm text-gray-400">Sin resultados para <strong className="text-gray-600">&ldquo;{query}&rdquo;</strong></p>
        </div>
      )}

      {!loading && !query && (
        <div className="text-center py-16">
          <Search size={32} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm text-gray-400">Escribe para buscar</p>
        </div>
      )}

      {/* Results */}
      {!loading && (
        <>
          {activeTab === 'fotos' && <FotoGrid fotos={results.fotos} />}

          {activeTab === 'tatuadores' && (
            <div className="grid sm:grid-cols-2 gap-2">
              {results.tatuadores.map(u => <UserCard key={u.id} user={u} />)}
              {query && !results.tatuadores.length && (
                <p className="text-sm text-gray-400 col-span-2 text-center py-8">Sin tatuadores encontrados</p>
              )}
            </div>
          )}

          {activeTab === 'estudios' && (
            <div className="grid sm:grid-cols-2 gap-2">
              {results.estudios.map(u => <UserCard key={u.id} user={u} />)}
              {query && !results.estudios.length && (
                <p className="text-sm text-gray-400 col-span-2 text-center py-8">Sin estudios encontrados</p>
              )}
            </div>
          )}

          {activeTab === 'carpetas' && (
            <div className="grid sm:grid-cols-2 gap-2">
              {results.carpetas.map(c => <CarpetaCard key={c.id} carpeta={c} />)}
              {query && !results.carpetas.length && (
                <p className="text-sm text-gray-400 col-span-2 text-center py-8">Sin carpetas encontradas</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function BuscarPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-6"><div className="h-12 bg-gray-50 rounded-2xl animate-pulse" /></div>}>
      <BuscarContent />
    </Suspense>
  )
}
