import { SignIn, useAuth, useUser } from '@clerk/react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ApiError, apiFetch } from './api'
import Header from './components/Header'
import BrawlPit from './pages/BrawlPit'
import Leaderboard from './pages/Leaderboard'
import TheStacks from './pages/TheStacks.tsx'
import Footer from './components/Footer'
import Placeholder from './components/Placeholder.tsx'

function ProtectedApp() {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const { getToken } = useAuth()

  const [isUserSynced, setIsUserSynced] = useState(false)
  const [syncError, setSyncError] = useState(false)

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

  if (!isLoaded)
    return (
      <div className="flex min-h-dvh flex-col bg-linear-to-b from-sky-800 to-sky-950 bg-fixed">
        <Placeholder message="Loading..." />
      </div>
    )
  if (!isSignedIn) return <Navigate to="/sign-in" replace />

  return (
    <div className="flex min-h-dvh flex-col bg-linear-to-b from-sky-800 to-sky-950 bg-fixed font-zain">
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
  )
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/sign-in/*"
        element={
          <div className="flex min-h-dvh items-center justify-center bg-linear-to-b from-sky-800 to-sky-950 bg-fixed">
            <SignIn routing="path" path="/sign-in" />
          </div>
        }
      />
      <Route path={'/*'} element={<ProtectedApp />} />
    </Routes>
  )
}
