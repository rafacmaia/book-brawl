import { useAuth, useUser } from '@clerk/react'
import { useEffect, useEffectEvent, useState } from 'react'
import { apiFetch } from '../api/client'

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
    const token = await getToken()

    const response = await apiFetch('/readers/me', token!, {
      method: 'POST',
      body: JSON.stringify({
        email: user!.primaryEmailAddress!.emailAddress,
        username:
          user!.username ??
          user!.firstName ??
          user!.primaryEmailAddress?.emailAddress?.split('@')[0] ??
          user!.id,
      }),
    })

    return (await response.json()) as { book_count: number }
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
