import { RedirectToSignIn, Show } from '@clerk/react'
import { Navigate, Route, Routes } from 'react-router-dom'
import BrawlPit from './pages/BrawlPit.tsx'
import Leaderboard from './pages/Leaderboard.tsx'
import './App.css'

export default function App() {
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
              <Routes>
                <Route path={'/'} element={<Navigate to="/brawl" replace />} />
                <Route path={'/brawl'} element={<BrawlPit />} />
                <Route path={'/leaderboard'} element={<Leaderboard />} />
              </Routes>
              <div className={'flex min-h-screen flex-col'}>
                <Routes>
                  <Route
                    path={'/'}
                    element={<Navigate to="/brawl" replace />}
                  />
                  <Route path={'/brawl'} element={<BrawlPit />} />
                  <Route path={'/leaderboard'} element={<Leaderboard />} />
                </Routes>
              </div>
            </Show>
          </>
        }
      />
    </Routes>
  )
}
