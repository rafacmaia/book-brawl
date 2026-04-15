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

  const cellXPadding = 'md:px-2 px-1'
  const thStyling = `md:pt-2 pt-1 first:pl-2 md:first:pl-5 pb-1 tracking-wide text-[15px] md:text-[20px] font-extrabold font-calistoga ${cellXPadding}`
  const tdStyling = `md:py-1.5 py-1 first:pl-2 md:first:pl-6 ${cellXPadding}`

  return (
    <main className="mx-auto flex h-full min-h-0 w-full grow flex-col items-center gap-4 overflow-y-auto p-2 text-primary/95 md:gap-8">
      <PageHeading title={'The Leaderboard'} />
      {loading ? (
        <Placeholder message={'Loading...'} />
      ) : error ? (
        <Placeholder message={error} />
      ) : emptyPit ? (
        <div
          className={
            'mb-12 flex w-full grow flex-col items-center justify-center gap-0 text-center font-zain text-5xl/20 font-extrabold tracking-wide text-primary/85'
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
              'mt-4 rounded-full bg-button px-6 py-2 text-center font-calistoga text-[18px] font-bold tracking-wide text-text shadow-2xl md:px-10 md:text-[22px]'
            }
          >
            {bookCount} Books<span className={'mx-3 md:mx-6'}>•</span>
            {Math.round(progress * 100)}% Complete
          </h2>
          <table className="w-full table-fixed border-collapse rounded-md bg-button text-text shadow-lg md:w-2/3">
            <thead className={'text-left'}>
              <tr className={'border-b-2 border-red-800 md:border-b-3'}>
                <th className={`w-[10%] md:w-[10%] ${thStyling}`}>
                  <span className={'block md:hidden'}>#</span>
                  <span className={'hidden md:block'}>Rank</span>
                </th>
                <th className={`w-[40%] max-md:pl-2 md:w-[45%] ${thStyling}`}>Title</th>
                <th className={`w-[30%] md:w-[30%] ${thStyling}`}>Author</th>
                <th className={`w-[20%] md:w-[15%] ${thStyling}`}>Accuracy</th>
              </tr>
            </thead>
            <tbody className={'text-[15px] opacity-95 md:text-[18px]'}>
              {rankings.map((book) => (
                <tr
                  key={book.rank}
                  className={'border-b border-red-800/80 last:border-none md:border-b-2'}
                >
                  <td
                    className={`font-calistoga text-[14px] font-bold text-red-900/75 md:text-[17px] ${tdStyling}`}
                  >
                    {book.rank}
                  </td>
                  <td className={`font-bold ${tdStyling}`}>
                    <span className={'line-clamp-3 max-md:pl-1'}>{book.title}</span>
                  </td>
                  <td className={`${tdStyling}`}>
                    <span className={'line-clamp-3'}>{book.author}</span>
                  </td>
                  <td className={`max-md:text-[14px] ${tdStyling}`}>
                    {TIER_LABELS[book.accuracy_tier]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  )
}
