import { RedirectToSignIn, Show, useAuth, useUser } from '@clerk/react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import { apiFetch } from './api'
import Header from './components/Header'
import BrawlPit from './pages/BrawlPit'
import Leaderboard from './pages/Leaderboard'
import ManagePit from './pages/ManagePit'
import Footer from './components/Footer'

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
                <Header />
                <Routes>
                  <Route path={'/'} element={<Navigate to="/brawl" replace />} />
                  <Route path={'/brawl'} element={<BrawlPit />} />
                  <Route path={'/leaderboard'} element={<Leaderboard />} />
                  <Route path={'/manage'} element={<ManagePit />} />
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
