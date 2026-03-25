'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from './AuthContext'
import { UserPlus, UserCheck } from 'lucide-react'

type Props = {
  targetUserId: string
  initialFollowing: boolean
  onFollowChange?: (following: boolean) => void
  size?: 'sm' | 'md'
}

export default function FollowButton({
  targetUserId,
  initialFollowing,
  onFollowChange,
  size = 'md',
}: Props) {
  const { user, openAuthModal } = useAuth()
  const supabase = createClientComponentClient()
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    if (!user) { openAuthModal('register'); return }
    if (loading || user.id === targetUserId) return
    setLoading(true)
    const was = following
    setFollowing(!was)
    onFollowChange?.(!was)
    if (was) {
      await supabase.from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
    } else {
      await supabase.from('user_follows')
        .insert({ follower_id: user.id, following_id: targetUserId })
    }
    setLoading(false)
  }

  if (size === 'sm') {
    return (
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); toggle() }}
        disabled={loading}
        className={`px-3 py-1 text-xs font-medium rounded-full transition-all disabled:opacity-50 ${
          following
            ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
            : 'bg-gray-900 text-white hover:bg-gray-700'
        }`}
      >
        {following ? 'Siguiendo' : 'Seguir'}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all disabled:opacity-50 ${
        following
          ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 border border-gray-200'
          : 'bg-gray-900 text-white hover:bg-gray-700'
      }`}
    >
      {following ? <UserCheck size={14} /> : <UserPlus size={14} />}
      {following ? 'Siguiendo' : 'Seguir'}
    </button>
  )
}
