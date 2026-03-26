'use client'

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import AuthModal from './AuthModal'
import SaveModal from './SaveModal'

type AuthContextType = {
  user: User | null
  session: Session | null
  username: string | null
  authReady: boolean
  lovedIds: Set<string>
  wantedIds: Set<string>
  savedIds: Set<string>
  openAuthModal: (mode?: 'login' | 'register') => void
  signOut: () => Promise<void>
  toggleLove: (photoId: string) => Promise<void>
  toggleWant: (photoId: string) => Promise<void>
  openSaveModal: (photoId: string) => void
  toggleSave: (photoId: string) => Promise<void>
  likeToast: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  username: null,
  authReady: false,
  lovedIds: new Set(),
  wantedIds: new Set(),
  savedIds: new Set(),
  openAuthModal: () => {},
  signOut: async () => {},
  toggleLove: async () => {},
  toggleWant: async () => {},
  openSaveModal: () => {},
  toggleSave: async () => {},
  likeToast: false,
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({
  children,
  initialSession,
}: {
  children: ReactNode
  initialSession: Session | null
}) {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null)
  const [session, setSession] = useState<Session | null>(initialSession)
  // authReady: true once we know for certain whether the user is logged in or not.
  // Starts true if the server already gave us a session, so WelcomePopup never fires falsely.
  const [authReady, setAuthReady] = useState(initialSession !== null)
  const [username, setUsername] = useState<string | null>(null)
  const [lovedIds, setLovedIds] = useState<Set<string>>(new Set())
  const [wantedIds, setWantedIds] = useState<Set<string>>(new Set())
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'login' | 'register'>('login')
  const [saveModalPhotoId, setSaveModalPhotoId] = useState<string | null>(null)
  const [likeToast, setLikeToast] = useState(false)
  const likeToastShownRef = useRef(false)

  const loadUserData = useCallback(
    async (userId: string) => {
      const [lovesRes, wantsRes, savesRes, userRes] = await Promise.all([
        supabase.from('likes').select('photo_id').eq('user_id', userId).eq('tipo', 'love'),
        supabase.from('likes').select('photo_id').eq('user_id', userId).eq('tipo', 'want'),
        supabase.from('saves').select('photo_id').eq('user_id', userId),
        supabase.from('users').select('username').eq('id', userId).single(),
      ])
      if (lovesRes.data) setLovedIds(new Set(lovesRes.data.map((r: { photo_id: string }) => r.photo_id)))
      if (wantsRes.data) setWantedIds(new Set(wantsRes.data.map((r: { photo_id: string }) => r.photo_id)))
      if (savesRes.data) setSavedIds(new Set(savesRes.data.map((r: { photo_id: string }) => r.photo_id)))
      if (userRes.data?.username) setUsername(userRes.data.username)
    },
    [supabase]
  )

  useEffect(() => {
    if (user) loadUserData(user.id)
  }, [user, loadUserData])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setAuthReady(true)  // auth state is now known — safe for WelcomePopup to check
      if (!session) {
        setLovedIds(new Set())
        setWantedIds(new Set())
        setSavedIds(new Set())
        setUsername(null)
      }
      if (session) setModalOpen(false)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const openAuthModal = useCallback((mode: 'login' | 'register' = 'login') => {
    setModalMode(mode)
    setModalOpen(true)
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [supabase])

  const toggleLove = useCallback(
    async (photoId: string) => {
      if (!user) { openAuthModal(); return }
      const isLoved = lovedIds.has(photoId)
      setLovedIds(prev => { const n = new Set(prev); isLoved ? n.delete(photoId) : n.add(photoId); return n })
      await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_id: photoId, tipo: 'love', action: isLoved ? 'unlike' : 'like' }),
      })
      if (!isLoved && !likeToastShownRef.current) {
        likeToastShownRef.current = true
        setLikeToast(true)
        setTimeout(() => setLikeToast(false), 4000)
      }
    },
    [user, lovedIds, openAuthModal]
  )

  const toggleWant = useCallback(
    async (photoId: string) => {
      if (!user) { openAuthModal(); return }
      const isWanted = wantedIds.has(photoId)
      setWantedIds(prev => { const n = new Set(prev); isWanted ? n.delete(photoId) : n.add(photoId); return n })
      await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_id: photoId, tipo: 'want', action: isWanted ? 'unlike' : 'like' }),
      })
    },
    [user, wantedIds, openAuthModal]
  )

  // Opens the SaveModal — if already saved, toggles directly (unsave)
  const openSaveModal = useCallback(
    (photoId: string) => {
      if (!user) { openAuthModal(); return }
      setSaveModalPhotoId(photoId)
    },
    [user, openAuthModal]
  )

  // Direct toggle (used by TattooActions in detail page)
  const toggleSave = useCallback(
    async (photoId: string) => {
      if (!user) { openAuthModal(); return }
      const isSaved = savedIds.has(photoId)
      setSavedIds(prev => {
        const next = new Set(prev)
        isSaved ? next.delete(photoId) : next.add(photoId)
        return next
      })
      // Use API route so server can send notification to photo owner
      await fetch('/api/save-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_id: photoId, action: isSaved ? 'unsave' : 'save' }),
      })
    },
    [user, savedIds, openAuthModal]
  )

  // Called by SaveModal after user picks a board
  const handleSaved = useCallback(
    async (carpetaId?: string) => {
      if (!user || !saveModalPhotoId) return
      const isSaved = savedIds.has(saveModalPhotoId)
      if (!isSaved) {
        setSavedIds(prev => new Set(prev).add(saveModalPhotoId))
        await fetch('/api/save-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo_id: saveModalPhotoId, carpeta_id: carpetaId }),
        })
      }
    },
    [user, saveModalPhotoId, savedIds]
  )

  const handleUnsave = useCallback(async () => {
    if (!user || !saveModalPhotoId) return
    setSavedIds(prev => { const n = new Set(prev); n.delete(saveModalPhotoId); return n })
    await fetch('/api/save-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_id: saveModalPhotoId, action: 'unsave' }),
    })
  }, [user, saveModalPhotoId])

  return (
    <AuthContext.Provider
      value={{ user, session, username, authReady, lovedIds, wantedIds, savedIds, openAuthModal, signOut, toggleLove, toggleWant, openSaveModal, toggleSave, likeToast }}
    >
      {children}
      {/* Like incentive toast — show once per session after first like */}
      {likeToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3 whitespace-nowrap animate-fade-in">
          <span>¿Tienes uno parecido? Compártelo</span>
          <a href="/upload" className="text-white underline font-medium">Subir foto</a>
        </div>
      )}
      {modalOpen && (
        <AuthModal
          mode={modalMode}
          onClose={() => setModalOpen(false)}
          onSwitchMode={setModalMode}
        />
      )}
      {saveModalPhotoId && (
        <SaveModal
          photoId={saveModalPhotoId}
          isSaved={savedIds.has(saveModalPhotoId)}
          onClose={() => setSaveModalPhotoId(null)}
          onSaved={handleSaved}
          onUnsave={handleUnsave}
        />
      )}
    </AuthContext.Provider>
  )
}
