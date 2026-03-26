'use client'

import { useEffect } from 'react'

export default function ProfileViewTracker({ profileId }: { profileId: string }) {
  useEffect(() => {
    fetch('/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: profileId }),
    }).catch(() => {})
  }, [profileId])

  return null
}
