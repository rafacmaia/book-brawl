import { RedirectToSignIn, Show, useAuth, useUser } from '@clerk/react'
import { Navigate, Route, Routes } from 'react-router-dom'
import BrawlPit from './pages/BrawlPit.tsx'
import Leaderboard from './pages/Leaderboard.tsx'
import Footer from './components/Footer.tsx'
import { Nav } from './components/Nav.tsx'
import { apiFetch } from './api.ts'
import { useEffect } from 'react'

export default function App() {
  const { user } = useUser()
  const { getToken } = useAuth()

  useEffect(() => {
    if (!user) return

    async function syncUser() {
      const token = await getToken()

      await apiFetch('/readers', token!, {
        method: 'POST',
        body: JSON.stringify({
          email: user!.primaryEmailAddress?.emailAddress ?? '',
          username:
            user!.username ??
            user!.firstName ??
            user!.primaryEmailAddress?.emailAddress?.split('@')[0] ??
            user!.id,
        }),
      })
    }

    void syncUser()
  }, [user])

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
              <div className={'flex h-full min-h-screen flex-col font-zain'}>
                <Nav />
                <Routes>
                  <Route path={'/'} element={<Navigate to="/brawl" replace />} />
                  <Route path={'/brawl'} element={<BrawlPit />} />
                  <Route path={'/leaderboard'} element={<Leaderboard />} />
                </Routes>
                <Footer />
              </div>
            </Show>
          </>
        }
      />
    </Routes>
  )
}
