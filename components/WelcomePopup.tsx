'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

export default function WelcomePopup() {
  const { user, openAuthModal } = useAuth()
  const [triggered, setTriggered] = useState(false)

  useEffect(() => {
    // Only for guests who haven't seen the popup before
    if (user) return
    if (typeof window === 'undefined') return
    if (localStorage.getItem('visited')) return

    const timer = setTimeout(() => {
      setTriggered(true)
      localStorage.setItem('visited', 'true')
      openAuthModal('register')
    }, 3000)

    return () => clearTimeout(timer)
  }, [user, openAuthModal])

  // This component renders nothing — it only triggers the modal as a side effect
  return null
}
