'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, Loader2, CheckCircle, X, Upload, AlertCircle } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'
import imageCompression from 'browser-image-compression'

type FileItem = {
  id: string
  file: File
  preview: string
  tags: string[]
  zona: string
  motivo: string
  alt_text: string
  es_tatuaje: boolean
  confidence: number
  analyzed: boolean
  analyzing: boolean
  analyzeError: string
  uploaded: boolean
  uploading: boolean
  uploadError: string
}

type Step = 'select' | 'review' | 'upload' | 'done'

const MAX_FILES = 20
const MAX_SIZE_MB = 10

export default function UploadPage() {
  const { user, openAuthModal } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<Step>('select')
  const [items, setItems] = useState<FileItem[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const makeItem = (file: File): FileItem | null => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return null
    return {
      id: `${Date.now()}-${Math.random()}`,
      file, preview: URL.createObjectURL(file),
      tags: [], zona: '', motivo: '', alt_text: '', es_tatuaje: true,
      confidence: 0, analyzed: false, analyzing: false, analyzeError: '',
      uploaded: false, uploading: false, uploadError: '',
    }
  }

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).slice(0, MAX_FILES - items.length)
    const newItems: FileItem[] = []
    for (const f of arr) { const item = makeItem(f); if (item) newItems.push(item) }
    setItems(prev => [...prev, ...newItems])
  }, [items.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const removeItem = (id: string) => setItems(prev => prev.filter(it => it.id !== id))
  const updateItem = (id: string, patch: Partial<FileItem>) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it))

  const compressFile = async (file: File): Promise<File> => {
    try {
      return await imageCompression(file, {
        maxSizeMB: 2, maxWidthOrHeight: 1920, useWebWorker: true,
        fileType: 'image/webp', initialQuality: 0.85,
      })
    } catch { return file }
  }

  // Analyze all in parallel batches of 3, transition to review immediately
  const startAnalyzeAndReview = async () => {
    setStep('review')
    const toAnalyze = items.filter(it => !it.analyzed)

    for (let i = 0; i < toAnalyze.length; i += 3) {
      const batch = toAnalyze.slice(i, i + 3)
      await Promise.all(batch.map(async (item) => {
        updateItem(item.id, { analyzing: true })
        try {
          const compressed = await compressFile(item.file)
          const fd = new FormData()
          fd.append('file', compressed)
          const res = await fetch('/api/analyze', { method: 'POST', body: fd })
          const json = await res.json()
          if (!res.ok) {
            updateItem(item.id, { analyzing: false, analyzed: true, analyzeError: json.error || `Error ${res.status}` })
          } else {
            updateItem(item.id, {
              analyzing: false, analyzed: true,
              tags: json.tags ?? [], zona: json.zona ?? '', motivo: json.motivo ?? '',
              alt_text: json.alt_text ?? '', es_tatuaje: json.es_tatuaje ?? true,
              confidence: json.confidence ?? 0.5, analyzeError: '',
            })
          }
        } catch {
          updateItem(item.id, { analyzing: false, analyzed: true, analyzeError: 'Error de red' })
        }
      }))
    }
  }

  const uploadAll = async () => {
    setStep('upload')
    setUploadProgress(0)
    const toUpload = items.filter(it => !it.uploaded)
    let done = 0
    for (const item of toUpload) {
      updateItem(item.id, { uploading: true, uploadError: '' })
      try {
        const compressed = await compressFile(item.file)
        const fd = new FormData()
        fd.append('file', compressed)
        fd.append('zona', item.zona)
        fd.append('motivo', item.motivo)
        fd.append('tamano', '')
        fd.append('tags', JSON.stringify(item.tags))
        fd.append('alt_text', item.alt_text)
        fd.append('confidence', '1.0')  // User reviewed → always publish
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const json = await res.json()
        if (!res.ok) {
          updateItem(item.id, { uploading: false, uploadError: json.error ?? 'Error' })
        } else {
          updateItem(item.id, { uploading: false, uploaded: true })
        }
      } catch {
        updateItem(item.id, { uploading: false, uploadError: 'Error de red' })
      }
      done++
      setUploadProgress(Math.round((done / toUpload.length) * 100))
    }
    router.refresh()
    setStep('done')
  }

  const addTag = (itemId: string, tag: string) => {
    const t = tag.trim().toLowerCase()
    if (!t) return
    setItems(prev => prev.map(it =>
      it.id === itemId && !it.tags.includes(t) ? { ...it, tags: [...it.tags, t] } : it
    ))
    setTagInput('')
  }

  const removeTag = (itemId: string, tag: string) => {
    setItems(prev => prev.map(it =>
      it.id === itemId ? { ...it, tags: it.tags.filter(t => t !== tag) } : it
    ))
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ImagePlus size={40} className="mx-auto mb-4 text-gray-300" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Subir fotos</h1>
        <p className="text-sm text-gray-400 mb-6">Inicia sesión para subir tus fotos</p>
        <button onClick={() => openAuthModal('login')} className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors">
          Iniciar sesión
        </button>
      </div>
    )
  }

  // ── SELECT ──
  if (step === 'select') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Subir fotos</h1>
          <p className="text-sm text-gray-400 mt-1">Hasta {MAX_FILES} fotos · JPG, PNG, WEBP · Máx {MAX_SIZE_MB}MB</p>
        </div>
        <div
          onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-colors mb-6 ${dragOver ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}
        >
          <ImagePlus size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-700">Arrastra fotos aquí o haz clic</p>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />
        </div>
        {items.length > 0 && (
          <>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 mb-6">
              {items.map(item => (
                <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={item.preview} alt="" className="w-full h-full object-cover" />
                  <button onClick={e => { e.stopPropagation(); removeItem(item.id) }} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white">
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{items.length} foto{items.length !== 1 ? 's' : ''}</p>
              <button onClick={startAnalyzeAndReview} className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-2xl hover:bg-gray-800 transition-colors">
                Analizar con IA
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // ── REVIEW: grid of all photos with tags ──
  if (step === 'review') {
    const allAnalyzed = items.every(it => it.analyzed)
    const analyzingCount = items.filter(it => it.analyzing).length

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 pb-28">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Revisar tags</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {allAnalyzed
                ? `${items.length} fotos listas`
                : `Analizando... ${analyzingCount} en proceso`
              }
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              {/* Thumbnail */}
              <div className="relative aspect-square bg-gray-100">
                <img src={item.preview} alt="" className="w-full h-full object-cover" />
                {item.analyzing && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <Loader2 size={20} className="text-gray-500 animate-spin" />
                  </div>
                )}
                {item.analyzed && !item.es_tatuaje && (
                  <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center">
                    <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">No tatuaje</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="p-3">
                {item.analyzeError && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-2">
                    <AlertCircle size={12} />
                    <span>IA no disponible — añade tags manualmente</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {item.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full cursor-pointer hover:bg-red-50 hover:text-red-500 transition-colors flex items-center gap-0.5"
                      onClick={() => removeTag(item.id, tag)}
                    >
                      {tag} <X size={8} />
                    </span>
                  ))}

                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(item.id, tagInput) }
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      onBlur={() => { if (tagInput.trim()) addTag(item.id, tagInput); setEditingId(null) }}
                      autoFocus
                      placeholder="tag..."
                      className="text-[11px] text-gray-600 bg-transparent outline-none w-16 px-1"
                    />
                  ) : (
                    <button
                      onClick={() => { setEditingId(item.id); setTagInput('') }}
                      className="text-[11px] text-gray-400 border border-dashed border-gray-200 px-2 py-0.5 rounded-full hover:border-gray-400 transition-colors"
                    >
                      + tag
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 z-30">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button onClick={() => setStep('select')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← Volver
            </button>
            <button
              onClick={uploadAll}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-2xl hover:bg-gray-800 transition-colors"
            >
              <Upload size={16} />
              Publicar {items.filter(it => it.es_tatuaje !== false).length} fotos
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── UPLOADING ──
  if (step === 'upload') {
    const uploaded = items.filter(it => it.uploaded).length
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Upload size={32} className="mx-auto mb-4 text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Subiendo...</h2>
        <p className="text-sm text-gray-400 mb-6">{uploaded} / {items.length}</p>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-gray-900 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
        </div>
      </div>
    )
  }

  // ── DONE ──
  const ok = items.filter(it => it.uploaded).length
  const failed = items.filter(it => it.uploadError && !it.uploaded).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
      <h2 className="text-2xl font-semibold text-gray-900 mb-1">{ok} foto{ok !== 1 ? 's' : ''} publicada{ok !== 1 ? 's' : ''}</h2>
      {failed > 0 && <p className="text-sm text-red-500 mt-1">{failed} fallaron</p>}
      <div className="flex gap-3 justify-center mt-8">
        <button onClick={() => { setItems([]); setStep('select') }} className="px-6 py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-2xl hover:bg-gray-200 transition-colors">
          Subir más
        </button>
        <button onClick={() => router.push(`/${user.user_metadata?.username || user.id}`)} className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-2xl hover:bg-gray-800 transition-colors">
          Ver mi perfil
        </button>
      </div>
    </div>
  )
}
