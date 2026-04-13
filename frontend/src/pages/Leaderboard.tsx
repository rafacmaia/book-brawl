import { useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import { apiFetch } from '../api'
import Placeholder from '../components/Placeholder'
import { PageHeading } from '../components/PageHeading.tsx'

interface BookData {
  rank: string
  title: string
  author: string
  accuracy_tier: number
}

const TIER_LABELS: Record<number, string> = {
  1: '🔴 Very Low',
  2: '🟠 Low',
  3: '🟡 Moderate',
  4: '🟢 High',
  5: '✅ Very High',
}

export default function Leaderboard() {
  const { getToken } = useAuth()

  const [rankings, setRankings] = useState<BookData[]>([])
  const [progress, setProgress] = useState<number>(0)
  const [bookCount, setBookCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchLeaderboard()
  }, [])

  async function fetchLeaderboard() {
    setLoading(true)
    setError(null)

    try {
      const token = await getToken()

      const [rankingsRes, progressRes] = await Promise.all([
        apiFetch('/leaderboard', token!),
        apiFetch('/progress', token!),
      ])

      const rankingsData = await rankingsRes.json()
      const progressData = await progressRes.json()

      setRankings(rankingsData)
      setProgress(progressData.progress)
      setBookCount(progressData.book_count)
    } catch {
      setError('Failed to load leaderboard. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex h-full min-h-0 grow flex-col items-center gap-8 overflow-y-auto p-4 text-primary/95">
      <PageHeading title={'The Leaderboard'} />
      {loading ? (
        <Placeholder message={'Loading...'} />
      ) : error ? (
        <Placeholder message={error} />
      ) : (
        <>
          <h2
            className={
              'mt-2 rounded-full bg-primary/90 px-10 py-2 text-center font-calistoga text-[22px] font-bold tracking-wide text-text shadow-2xl'
            }
          >
            {bookCount} Books<span className={'mx-6'}>•</span>
            {Math.round(progress * 100)}% Complete
          </h2>
          <table className="mt-2 w-2/3 table-fixed border-collapse rounded-md bg-primary/90 text-text shadow-lg">
            <thead className={'text-left text-[20px] text-accent'}>
              <tr className={'border-b-3 border-accent'}>
                <th className={`w-1/13 pt-2 pr-4 pb-1 pl-6 font-extrabold`}>#</th>
                <th className={`w-6/13 px-4 pt-2 pb-1 font-extrabold`}>Title</th>
                <th className={`w-4/13 px-4 pt-2 pb-1 font-extrabold`}>Author</th>
                <th className={`w-2/13 pt-2 pr-6 pb-1 pl-4 font-extrabold`}>Accuracy</th>
              </tr>
            </thead>
            <tbody className={'text-[18px]'}>
              {rankings.map((book) => (
                <tr key={book.rank} className={'border-b-2 border-background'}>
                  <td className={`py-1 pr-4 pl-7 font-extrabold text-accent`}>{book.rank}</td>
                  <td className={`px-4 py-1 font-bold`}>{book.title}</td>
                  <td className={`px-4 py-1`}>{book.author}</td>
                  <td className={`py-1 pr-7 pl-4`}>{TIER_LABELS[book.accuracy_tier]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  )
}
