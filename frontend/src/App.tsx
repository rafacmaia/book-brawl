import { SignIn, SignUp, useAuth } from '@clerk/react'
import { type ReactNode } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'

import PlaceholderMessaging from '@/components/feedback/PlaceholderMessaging'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import { type SyncState, useUserSync } from '@/hooks/useUserSync'
import BrawlPit from '@/pages/BrawlPit'
import Leaderboard from '@/pages/Leaderboard'
import Onboarding from '@/pages/Onboarding'
import TheStacks from '@/pages/TheStacks'

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
  const { isLoaded, isSignedIn } = useAuth()
  const syncState = useUserSync()

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
          {/* Catch-all for unmatched routes (redirect to `/brawl`).
              TODO: Replace with a dedicated 404 page. */}
          <Route path="*" element={<Navigate to="/brawl" replace />} />
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

function AppLayout({ children }: { children?: ReactNode }) {
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
