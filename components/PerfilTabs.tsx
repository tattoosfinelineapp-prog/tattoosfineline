'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CheckSquare, Square, Tag, Trash2, X, Check, FolderOpen } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import GaleriaGrid from './GaleriaGrid'
import type { Tattoo } from '@/lib/data'
import type { Carpeta } from '@/lib/queries'

type Props = {
  fotos: Tattoo[]
  guardadas: Tattoo[]
  carpetas: Carpeta[]
}

function SelectableGrid({
  fotos,
  selecting,
  selected,
  onToggle,
}: {
  fotos: Tattoo[]
  selecting: boolean
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  if (!selecting) return <GaleriaGrid tattoos={fotos} />

  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-2">
      {fotos.map(foto => {
        const isSelected = selected.has(foto.id)
        return (
          <div
            key={foto.id}
            className="break-inside-avoid mb-2 relative cursor-pointer"
            onClick={() => onToggle(foto.id)}
          >
            <div className={`rounded-2xl overflow-hidden relative transition-all ${isSelected ? 'ring-2 ring-gray-900 ring-offset-2' : ''}`}>
              <Image
                src={foto.url}
                alt={foto.alt_text || foto.title}
                width={400}
                height={foto.height || 350}
                className={`w-full h-auto block transition-opacity ${isSelected ? 'opacity-75' : ''}`}
                sizes="(max-width: 640px) 50vw, 25vw"
                loading="lazy"
              />
              {/* Checkbox overlay */}
              <div className={`absolute top-2 left-2 transition-all ${selecting ? 'opacity-100' : 'opacity-0'}`}>
                {isSelected
                  ? <CheckSquare size={20} className="text-gray-900 bg-white rounded" />
                  : <Square size={20} className="text-white drop-shadow" />
                }
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function PerfilTabs({ fotos, guardadas, carpetas }: Props) {
  const supabase = createClientComponentClient()
  const [tab, setTab]           = useState<'creados' | 'guardados'>('creados')
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected]   = useState<Set<string>>(new Set())
  const [tagInput, setTagInput]   = useState('')
  const [showTagBar, setShowTagBar] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [savedMsg, setSavedMsg]   = useState('')

  const toggleSelect = (id: string) =>
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  const exitSelect = () => {
    setSelecting(false)
    setSelected(new Set())
    setShowTagBar(false)
    setTagInput('')
  }

  const handleAddTags = async () => {
    const tags = tagInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    if (!tags.length || !selected.size) return
    setSaving(true)
    const ids = Array.from(selected)

    // For each selected photo, append new tags (no duplicates)
    for (const id of ids) {
      const foto = fotos.find(f => f.id === id)
      if (!foto) continue
      const existing = (foto as Tattoo & { tags?: string[] }).tags ?? []
      const merged = Array.from(new Set([...existing, ...tags]))
      await supabase.from('photos').update({ tags: merged }).eq('id', id)
    }

    setSaving(false)
    setSavedMsg(`Tags añadidos a ${ids.length} fotos`)
    setTagInput('')
    setShowTagBar(false)
    setTimeout(() => setSavedMsg(''), 3000)
  }

  const handleDelete = async () => {
    if (!selected.size) return
    if (!confirm(`¿Eliminar ${selected.size} foto${selected.size !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`)) return
    setSaving(true)
    const ids = Array.from(selected)
    await supabase.from('photos').delete().in('id', ids)
    setSaving(false)
    exitSelect()
    // Reload to reflect deletions
    window.location.reload()
  }

  return (
    <div className="pb-24">
      {/* Tab buttons */}
      <div className="flex items-center justify-between border-b border-gray-100 mb-6">
        <div className="flex gap-1">
          <button
            onClick={() => { setTab('creados'); exitSelect() }}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === 'creados' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            Creados ({fotos.length})
          </button>
          <button
            onClick={() => { setTab('guardados'); exitSelect() }}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === 'guardados' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            Guardados ({guardadas.length})
          </button>
        </div>

        {/* Seleccionar button — only in Creados tab */}
        {tab === 'creados' && fotos.length > 0 && (
          selecting ? (
            <button onClick={exitSelect} className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-2 py-1">
              Cancelar
            </button>
          ) : (
            <button
              onClick={() => setSelecting(true)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors px-2 py-1"
            >
              <CheckSquare size={15} />
              Seleccionar
            </button>
          )
        )}
      </div>

      {/* Success message */}
      {savedMsg && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-green-50 rounded-xl text-sm text-green-700">
          <Check size={14} />
          {savedMsg}
        </div>
      )}

      {/* Tab: Creados */}
      {tab === 'creados' && (
        fotos.length > 0 ? (
          <SelectableGrid
            fotos={fotos}
            selecting={selecting}
            selected={selected}
            onToggle={toggleSelect}
          />
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-base">Aún no hay fotos publicadas</p>
          </div>
        )
      )}

      {/* Tab: Guardados */}
      {tab === 'guardados' && (
        <div>
          {carpetas.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Tableros</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {carpetas.map(carpeta => (
                  <Link key={carpeta.id} href={`/tablero/${carpeta.id}`} className="group block">
                    <div className="aspect-square rounded-2xl bg-gray-100 overflow-hidden mb-2 relative">
                      <div className="absolute inset-0 grid grid-cols-2 gap-0.5">
                        {[0, 1, 2, 3].map(i => {
                          const photo = guardadas[i]
                          return (
                            <div key={i} className="relative overflow-hidden bg-gray-200">
                              {photo && (
                                <Image
                                  src={photo.url}
                                  alt=""
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                                  sizes="10vw"
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate">{carpeta.nombre}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {guardadas.length > 0 ? (
            <div>
              {carpetas.length > 0 && (
                <h3 className="text-sm font-medium text-gray-500 mb-4">Todos los guardados</h3>
              )}
              <GaleriaGrid tattoos={guardadas} />
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <p>Aún no hay fotos guardadas</p>
            </div>
          )}
        </div>
      )}

      {/* ── Bottom selection bar ── */}
      {selecting && selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#111111] text-white px-4 py-4">
          <div className="max-w-5xl mx-auto">
            {/* Tag input */}
            {showTagBar && (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTags()}
                  placeholder="floral, luna, brazo... (separados por coma)"
                  autoFocus
                  className="flex-1 px-3 py-2 bg-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:bg-white/20 border border-white/10"
                />
                <button
                  onClick={handleAddTags}
                  disabled={saving || !tagInput.trim()}
                  className="px-4 py-2 bg-white text-gray-900 text-sm font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {saving ? '...' : 'Aplicar'}
                </button>
                <button onClick={() => setShowTagBar(false)} className="p-2 text-white/60 hover:text-white">
                  <X size={18} />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selected.size} foto{selected.size !== 1 ? 's' : ''} seleccionada{selected.size !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTagBar(!showTagBar)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/10 rounded-xl text-sm hover:bg-white/20 transition-colors"
                >
                  <Tag size={14} />
                  Tags
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-500/80 rounded-xl text-sm hover:bg-red-500 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
