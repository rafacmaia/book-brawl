import { useAuth, useUser } from '@clerk/react'
import { useEffect, useEffectEvent, useState } from 'react'

import { apiFetch } from '@/api/client'
import type { User, UserBookCount } from '@/api/types'

export type SyncState =
  | { type: 'pending' }
  | { type: 'synced'; hasBooks: boolean }
  | { type: 'error' }

export function useUserSync() {
  const { getToken } = useAuth()
  const { user } = useUser()

  const [syncState, setSyncState] = useState<SyncState>({ type: 'pending' })

  const userId = user?.id

  const syncUser = useEffectEvent(async () => {
    if (!user) throw new Error('Mo authenticated user')

    const email = user.primaryEmailAddress?.emailAddress
    if (!email) throw new Error('Account has no email address')

    const token = await getToken()
    if (!token) throw new Error('Not authenticated')

    const username = user.username ?? user.firstName ?? email.split('@')[0] ?? user.id

    const body: User = { email, username }

    const response = await apiFetch('/readers/me', token!, {
      method: 'POST',
      body: JSON.stringify(body),
    })

    return (await response.json()) as UserBookCount
  })

  useEffect(() => {
    if (!userId) return

    void (async () => {
      try {
        const result = await syncUser()
        setSyncState({ type: 'synced', hasBooks: result.book_count > 0 })
      } catch (err) {
        console.error('Failed to sync user:', err)
        setSyncState({ type: 'error' })
      }
    })()
  }, [userId])

  return syncState
}
