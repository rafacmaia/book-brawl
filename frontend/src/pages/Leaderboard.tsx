import { useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import { apiFetch } from '../api'
import Placeholder from '../components/Placeholder'
import PageHeading from '../components/PageHeading'
import { CircleAlert } from 'lucide-react'
import { NavLink } from 'react-router-dom'

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
  const [emptyPit, setEmptyPit] = useState<boolean>(false)
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

      if (progressData.book_count === 0) {
        setEmptyPit(true)
        return
      }

      setRankings(rankingsData)
      setProgress(progressData.progress)
      setBookCount(progressData.book_count)
    } catch {
      setError('Failed to load leaderboard. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const cellXPadding = 'px-2'
  const thStyling = `pt-2 first:pl-5  pb-1 tracking-wide text-[20px] font-extrabold font-calistoga ${cellXPadding}`
  const tdStyling = `py-1.5 first:pl-6 ${cellXPadding}`

  return (
    <main className="flex h-full min-h-0 grow flex-col items-center gap-8 overflow-y-auto p-4 text-primary/95">
      <PageHeading title={'The Leaderboard'} />
      {loading ? (
        <Placeholder message={'Loading...'} />
      ) : error ? (
        <Placeholder message={error} />
      ) : emptyPit ? (
        <div
          className={
            'mb-12 flex grow flex-col items-center justify-center gap-0 text-center font-zain text-5xl/20 font-extrabold tracking-wide text-primary/85'
          }
        >
          <CircleAlert size={72} className={'mb-8'} />
          <p>No books in the pit!</p>
          <p>
            <NavLink
              to={'/manage'}
              className={`font-extrabold text-primary/90 underline decoration-accent/80 decoration-4 underline-offset-4 transition-all hover:text-[52px] hover:text-primary hover:decoration-wavy hover:underline-offset-8`}
            >
              Feed the Pit
            </NavLink>{' '}
            and try again.
          </p>
        </div>
      ) : (
        <>
          <h2
            className={
              'mt-4 rounded-full bg-button px-10 py-2 text-center font-calistoga text-[22px] font-bold tracking-wide text-text shadow-2xl'
            }
          >
            {bookCount} Books<span className={'mx-6'}>•</span>
            {Math.round(progress * 100)}% Complete
          </h2>
          <table className="w-2/3 table-fixed border-collapse rounded-md bg-button text-text shadow-lg">
            <thead className={'text-left'}>
              <tr className={'border-b-3 border-red-800'}>
                <th className={`w-[10%] ${thStyling}`}>Rank</th>
                <th className={`w-[45%] ${thStyling}`}>Title</th>
                <th className={`w-[30%] ${thStyling}`}>Author</th>
                <th className={`w-[15%] ${thStyling}`}>Accuracy</th>
              </tr>
            </thead>
            <tbody className={'text-[18px] opacity-95'}>
              {rankings.map((book) => (
                <tr key={book.rank} className={'border-b-2 border-red-800/80 last:border-none'}>
                  <td className={`font-calistoga font-bold text-red-900/75 ${tdStyling}`}>
                    {book.rank}
                  </td>
                  <td className={`font-bold ${tdStyling}`}>{book.title}</td>
                  <td className={tdStyling}>{book.author}</td>
                  <td className={tdStyling}>{TIER_LABELS[book.accuracy_tier]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  )
}
