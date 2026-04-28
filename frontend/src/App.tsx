import { RedirectToSignIn, Show, useAuth, useUser } from '@clerk/react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ApiError, apiFetch } from './api'
import Header from './components/Header'
import BrawlPit from './pages/BrawlPit'
import Leaderboard from './pages/Leaderboard'
import TheStacks from './pages/TheStacks.tsx'
import Footer from './components/Footer'
import Placeholder from './components/Placeholder.tsx'

export default function App() {
  const { getToken } = useAuth()
  const { user } = useUser()

  const [isUserSynced, setIsUserSynced] = useState(false)
  const [syncError, setSyncError] = useState<boolean>(false)

  useEffect(() => {
    if (!user) {
      setIsUserSynced(false)
      setSyncError(false)
      return
    }

    void syncUser().catch((err) => {
      console.error('Failed to sync user:', err)
      setSyncError(true)
    })
  }, [user])

  async function syncUser() {
    const token = await getToken()

    await apiFetch('/readers', token!, {
      method: 'POST',
      body: JSON.stringify({
        email: user!.primaryEmailAddress!.emailAddress,
        username:
          user!.username ??
          user!.firstName ??
          user!.primaryEmailAddress?.emailAddress?.split('@')[0] ??
          user!.id,
      }),
    }).catch((err) => {
      if (err instanceof ApiError && err.status === 409) {
        console.error('Unexpected conflict on reader sync:', err)
      } else {
        throw err
      }
    })

    setIsUserSynced(true)
  }

  return (
    <Routes>
      <Route
        path={'/*'}
        element={
          <>
            <Show when={'signed-out'}>
              <RedirectToSignIn />
            </Show>
            <Show when={'signed-in'}>
              <div
                className={
                  'flex min-h-dvh flex-col bg-linear-to-b from-sky-800 to-sky-950 bg-fixed font-zain'
                }
              >
                <Header />
                {isUserSynced ? (
                  <Routes>
                    <Route path={'/'} element={<Navigate to="/brawl" replace />} />
                    <Route path={'/brawl'} element={<BrawlPit />} />
                    <Route path={'/leaderboard'} element={<Leaderboard />} />
                    <Route path={'/stacks'} element={<TheStacks />} />
                  </Routes>
                ) : syncError ? (
                  <Placeholder
                    message={'Something went really wrong. Please refresh or try logging in again.'}
                  />
                ) : (
                  <Placeholder message={'Loading...'} />
                )}
                <Footer />
              </div>
            </Show>
          </>
        }
      />
    </Routes>
  )
}
