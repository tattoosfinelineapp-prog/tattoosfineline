'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import AuthModal from './AuthModal'

type AuthContextType = {
  user: User | null
  session: Session | null
  likedIds: Set<string>
  savedIds: Set<string>
  openAuthModal: (mode?: 'login' | 'register') => void
  signOut: () => Promise<void>
  toggleLike: (photoId: string) => Promise<void>
  toggleSave: (photoId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  likedIds: new Set(),
  savedIds: new Set(),
  openAuthModal: () => {},
  signOut: async () => {},
  toggleLike: async () => {},
  toggleSave: async () => {},
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
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'login' | 'register'>('login')

  const loadUserData = useCallback(
    async (userId: string) => {
      const [likesRes, savesRes] = await Promise.all([
        supabase.from('likes').select('photo_id').eq('user_id', userId),
        supabase.from('saves').select('photo_id').eq('user_id', userId),
      ])
      if (likesRes.data) setLikedIds(new Set(likesRes.data.map((r: { photo_id: string }) => r.photo_id)))
      if (savesRes.data) setSavedIds(new Set(savesRes.data.map((r: { photo_id: string }) => r.photo_id)))
    },
    [supabase]
  )

  useEffect(() => {
    if (user) loadUserData(user.id)
  }, [user, loadUserData])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (!session) {
        setLikedIds(new Set())
        setSavedIds(new Set())
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

  const toggleLike = useCallback(
    async (photoId: string) => {
      if (!user) { openAuthModal(); return }
      const isLiked = likedIds.has(photoId)
      setLikedIds(prev => {
        const next = new Set(prev)
        isLiked ? next.delete(photoId) : next.add(photoId)
        return next
      })
      if (isLiked) {
        await supabase.from('likes').delete().eq('user_id', user.id).eq('photo_id', photoId)
      } else {
        await supabase.from('likes').insert({ user_id: user.id, photo_id: photoId })
      }
    },
    [user, likedIds, openAuthModal, supabase]
  )

  const toggleSave = useCallback(
    async (photoId: string) => {
      if (!user) { openAuthModal(); return }
      const isSaved = savedIds.has(photoId)
      setSavedIds(prev => {
        const next = new Set(prev)
        isSaved ? next.delete(photoId) : next.add(photoId)
        return next
      })
      if (isSaved) {
        await supabase.from('saves').delete().eq('user_id', user.id).eq('photo_id', photoId)
      } else {
        await supabase.from('saves').insert({ user_id: user.id, photo_id: photoId })
      }
    },
    [user, savedIds, openAuthModal, supabase]
  )

  return (
    <AuthContext.Provider
      value={{ user, session, likedIds, savedIds, openAuthModal, signOut, toggleLike, toggleSave }}
    >
      {children}
      {modalOpen && (
        <AuthModal
          mode={modalMode}
          onClose={() => setModalOpen(false)}
          onSwitchMode={setModalMode}
        />
      )}
    </AuthContext.Provider>
  )
}
