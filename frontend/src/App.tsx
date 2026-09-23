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
        <Route element={<SignIn path="/sign-in" routing="path" />} path="/sign-in/*" />
        <Route element={<SignUp path="/sign-up" routing="path" />} path="/sign-up/*" />
      </Route>
      <Route element={<ProtectedApp />} path={'/*'} />
    </Routes>
  )
}

function ProtectedApp() {
  const { isLoaded, isSignedIn } = useAuth()
  const syncState = useUserSync()

  if (!isLoaded) return <AppLayout />
  if (!isSignedIn) return <Navigate replace to="/sign-in" />

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
            element={<Navigate replace to={state.hasBooks ? '/brawl' : '/freshstart'} />}
            path={'/'}
          />
          <Route element={<AppLayout />}>
            <Route
              element={state.hasBooks ? <Navigate replace to={'/brawl'} /> : <Onboarding />}
              path={'/freshstart'}
            />
          </Route>
          <Route element={<ChromeLayout />}>
            <Route element={<BrawlPit />} path={'/brawl'} />
            <Route element={<Leaderboard />} path={'/leaderboard'} />
            <Route element={<TheStacks />} path={'/stacks'} />
          </Route>
          {/* Catch-all for unmatched routes (redirect to `/brawl`).
              TODO: Replace with a dedicated 404 page. */}
          <Route element={<Navigate replace to="/brawl" />} path="*" />
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
