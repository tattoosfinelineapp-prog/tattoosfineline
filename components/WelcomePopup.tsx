'use client'

import { useEffect } from 'react'
import { useAuth } from './AuthContext'

export default function WelcomePopup() {
  const { user, authReady, openAuthModal } = useAuth()

  useEffect(() => {
    // Wait until we know for sure whether the user is logged in.
    // This prevents the popup firing during the Google OAuth redirect window
    // when cookies are set but onAuthStateChange hasn't fired yet.
    if (!authReady) return
    if (user) return
    if (typeof window === 'undefined') return
    if (localStorage.getItem('visited')) return

    const timer = setTimeout(() => {
      // Double-check user is still not logged in before opening modal
      openAuthModal('register')
      localStorage.setItem('visited', 'true')
    }, 3000)

    return () => clearTimeout(timer)
  }, [authReady, user, openAuthModal])

  return null
}
