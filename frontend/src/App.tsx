import { SignIn, SignUp, useAuth, useUser } from '@clerk/react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiFetch } from './api'
import BrawlPit from './pages/BrawlPit'
import Leaderboard from './pages/Leaderboard'
import TheStacks from './pages/TheStacks'
import PlaceholderMessaging from './components/feedback/PlaceholderMessaging'
import Onboarding from './pages/Onboarding'
import Footer from './components/layout/Footer'
import Header from './components/layout/Header'

type SyncState = { type: 'pending' } | { type: 'synced'; hasBooks: boolean } | { type: 'error' }

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
        <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
      </Route>
      <Route path={'/*'} element={<ProtectedApp />} />
    </Routes>
  )
}

function ProtectedApp() {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { user } = useUser()

  const [syncState, setSyncState] = useState<SyncState>({ type: 'pending' })

  useEffect(() => {
    if (!user) {
      setSyncState({ type: 'pending' })
      return
    }

    // Skip if we've already synced for this user
    if (syncState.type === 'synced') return

    void (async () => {
      try {
        const result = await syncUser()
        const hasBooks = result.book_count > 0
        setSyncState({ type: 'synced', hasBooks })
      } catch (err) {
        console.error('Failed to sync user:', err)
        setSyncState({ type: 'error' })
      }
    })()
  }, [user])

  async function syncUser(): Promise<{ book_count: number }> {
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

    return await response.json()
  }

  if (!isLoaded) return <AppLayout />

  if (!isSignedIn) return <Navigate to="/sign-in" replace />

  return <AppRouter state={syncState} />
}

function AppRouter({ state }: { state: SyncState }) {
  switch (state.type) {
    case 'pending':
      return <AppLayout />

    case 'error':
      return (
        <AppLayout>
          <PlaceholderMessaging message="Something went wrong. Please refresh or try logging in again." />
        </AppLayout>
      )

    case 'synced':
      return (
        <Routes>
          <Route
            path={'/'}
            element={<Navigate to={state.hasBooks ? '/brawl' : '/onboarding'} replace />}
          />
          <Route element={<AppLayout />}>
            <Route
              path={'/onboarding'}
              element={state.hasBooks ? <Navigate to={'/brawl'} replace /> : <Onboarding />}
            />
          </Route>
          <Route element={<ChromeLayout />}>
            <Route path={'/brawl'} element={<BrawlPit />} />
            <Route path={'/leaderboard'} element={<Leaderboard />} />
            <Route path={'/stacks'} element={<TheStacks />} />
          </Route>
        </Routes>
      )
  }
}

function AuthLayout() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Outlet />
    </div>
  )
}

function AppLayout({ children }: { children?: React.ReactNode }) {
  return <div className="flex min-h-dvh flex-col font-zain">{children ?? <Outlet />}</div>
}

function ChromeLayout() {
  return (
    <div className="flex min-h-dvh flex-col font-zain">
      <Header />
      <Outlet />
      <Footer />
    </div>
  )
}
