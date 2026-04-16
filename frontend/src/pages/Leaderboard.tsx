import { useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import { apiFetch } from '../api'
import Placeholder from '../components/Placeholder'
import PageHeading from '../components/PageHeading'
import {
  BadgeCheck,
  CircleAlert,
  CircleStar,
  Sparkle,
  SquareX,
  Squircle,
  Star,
  Trophy,
} from 'lucide-react'
import { InformationCircleIcon as InfoCircleMini } from '@heroicons/react/16/solid'
import { InformationCircleIcon as InfoCircle } from '@heroicons/react/20/solid'
import { NavLink } from 'react-router-dom'

interface BookData {
  rank: number
  title: string
  author: string
  accuracy_tier: number
}

const TIER_LABELS: Record<number, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Moderate',
  4: 'High',
  5: 'Very High',
}

function TierSymbol({ accuracyTier, styling }: { accuracyTier: number; styling: string }) {
  if (accuracyTier === 1) {
    return <Squircle stroke={'none'} className={`fill-red-500/90 ${styling}`} />
  } else if (accuracyTier === 2) {
    return <Squircle stroke={'none'} className={`fill-orange-500/90 ${styling}`} />
  } else if (accuracyTier === 3) {
    return <Squircle stroke={'none'} className={`fill-yellow-600/85 ${styling}`} />
  } else if (accuracyTier === 4) {
    return <Squircle stroke={'none'} className={`fill-green-600/90 ${styling}`} />
  } else if (accuracyTier === 5) {
    return <BadgeCheck strokeWidth={3} className={`text-sky-700/90 ${styling}`} />
  } else {
    return null
  }
}

function AccuracyModal({ onClose }: { onClose: () => void }) {
  const fieldStyling = 'font-bold'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative flex w-[90%] flex-col gap-4 rounded-lg border-6 border-background bg-button p-6 font-zain text-text shadow-2xl md:w-lg md:gap-6 md:rounded-md md:border-4 md:px-10 md:py-8">
        <h2 className="font-calistoga text-3xl font-bold text-text">Accuracy Tiers</h2>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 cursor-pointer font-extrabold text-red-700 transition-all hover:scale-112 active:scale-95 md:top-3 md:right-3"
        >
          <SquareX className="size-5.75 md:size-7" />
        </button>
        <div className="flex flex-col gap-2 text-lg text-text/90 md:gap-3">
          <p className="">
            Accuracy measures how trustworthy a book's current rank is. The more a book brawls, the
            higher its rank accuracy.
          </p>
          <hr className="my-1 h-px border-background/60" />
          <table className="w-full table-fixed border-collapse [&_td]:p-1">
            <colgroup>
              <col className="w-1/10 align-top" />
              <col className="w-9/10" />
            </colgroup>
            <tbody>
              <tr>
                <td>
                  <TierSymbol accuracyTier={1} styling="size-7 max-sm:-translate-x-1.25" />
                </td>
                <td>
                  <span className={fieldStyling}>Very Low</span> – Just added, ranking mostly based
                  on any initial rating
                </td>
              </tr>
              <tr>
                <td>
                  <TierSymbol accuracyTier={2} styling="size-7 max-sm:-translate-x-1.25" />
                </td>
                <td>
                  <span className={fieldStyling}>Low</span> – Some brawls in, broad tier likely
                  correct (top/mid/bottom)
                </td>
              </tr>
              <tr>
                <td>
                  <TierSymbol accuracyTier={3} styling="size-7 max-sm:-translate-x-1.25" />
                </td>
                <td>
                  <span className={fieldStyling}>Moderate</span> – Position is fairly reliable,
                  exact rank still shifting
                </td>
              </tr>
              <tr>
                <td>
                  <TierSymbol accuracyTier={4} styling="size-7 max-sm:-translate-x-1.25" />
                </td>
                <td>
                  <span className={fieldStyling}>High</span> – Position is well established, likely
                  within ~5 spots
                </td>
              </tr>
              <tr>
                <td>
                  <TierSymbol accuracyTier={5} styling="size-7 max-sm:-translate-x-1.25" />
                </td>
                <td>
                  <span className={fieldStyling}>Very High</span> – Locked in, unlikely to shift by
                  more than 1 or 2 spots
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function Leaderboard() {
  const { getToken } = useAuth()

  const [rankings, setRankings] = useState<BookData[]>([])
  const [progress, setProgress] = useState<number>(0)
  const [bookCount, setBookCount] = useState<number>(0)
  const [showAccuracyModal, setShowAccuracyModal] = useState<boolean>(false)

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
  const thStyling = `md:pt-2 pt-1 first:pl-2 md:first:pl-5 pb-1 text-[16px] tracking-wide md:text-[20px] font-extrabold font-calistoga ${cellXPadding}`
  const tdStyling = `md:py-1.75 py-1 first:pl-3 md:first:pl-6 ${cellXPadding}`

  return (
    <main className="mx-auto flex h-full min-h-0 w-[98%] grow flex-col items-center gap-4 overflow-y-auto p-2 text-primary/95 md:gap-8">
      {showAccuracyModal && <AccuracyModal onClose={() => setShowAccuracyModal(false)} />}

      <PageHeading
        title={
          <>
            <span className="sm:hidden">Leaderboard</span>
            <span className="hidden sm:inline">The Leaderboard</span>
          </>
        }
      />
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
                  <span className={'sm:hidden'}>#</span>
                  <span className={'hidden sm:inline'}>Rank</span>
                </th>
                <th className={`w-[74%] md:w-[46%] ${thStyling}`}>
                  <span className={'sm:hidden'}>Book</span>
                  <span className={'hidden sm:inline'}>Title</span>
                </th>
                <th className={`max-md:hidden md:w-[31%] ${thStyling}`}>Author</th>
                <th className={`w-[16%] text-right md:w-[13%] md:text-left ${thStyling}`}>
                  <button onClick={() => setShowAccuracyModal(true)} className={'inline-flex'}>
                    <span className={'sm:hidden'}>Acc.</span>
                    <span className={'hidden sm:inline'}>Accuracy</span>
                    <InfoCircleMini className={'size-3 shrink-0 translate-y-px sm:hidden'} />
                    <InfoCircle
                      className={'ml-1 hidden size-4 shrink-0 translate-y-px sm:inline'}
                    />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className={'opacity-95'}>
              {rankings.map((book) => (
                <tr
                  key={book.rank}
                  className={`border-b border-red-800/80 last:border-none md:border-b-2`}
                >
                  <td
                    className={`relative flex items-center justify-between font-calistoga font-black md:text-[18px] ${tdStyling} ${book.rank < 100 ? 'text-[16px]' : book.rank < 1000 ? 'text-[15px]' : 'text-[14px]'}`}
                  >
                    {book.rank}
                    {book.rank == 1 && (
                      <Trophy
                        className={
                          'hidden size-4.25 -translate-y-px stroke-3 text-yellow-800/80 sm:inline'
                        }
                      />
                    )}
                    {book.rank == 2 && (
                      <CircleStar
                        className={
                          'hidden size-4.25 -translate-y-px stroke-2 text-yellow-800/70 sm:inline'
                        }
                      />
                    )}
                    {book.rank == 3 && (
                      <Star
                        className={'hidden size-3.75 -translate-y-px text-yellow-800/60 sm:inline'}
                      />
                    )}
                    {book.rank == 4 && (
                      <Sparkle
                        className={'hidden size-3.75 -translate-y-px text-yellow-800/50 sm:inline'}
                      />
                    )}
                  </td>
                  <td className={`relative ${tdStyling}`}>
                    <span className={`line-clamp-2 text-[16px] font-bold md:text-[18px]`}>
                      {book.title}
                    </span>
                    <span className="line-clamp-1 font-zain text-[14px] font-normal opacity-75 sm:hidden">
                      {book.author}
                    </span>
                    {book.rank == 1 && (
                      <Trophy
                        className={
                          'absolute right-0 bottom-2 size-4.25 stroke-3 text-yellow-800/80 sm:hidden'
                        }
                      />
                    )}
                    {book.rank == 2 && (
                      <CircleStar
                        className={
                          'absolute right-0 bottom-2 size-4.25 text-yellow-800/70 sm:hidden'
                        }
                      />
                    )}
                    {book.rank == 3 && (
                      <Star
                        className={'absolute right-0 bottom-2 size-4 text-yellow-800/60 sm:hidden'}
                      />
                    )}
                    {book.rank == 4 && (
                      <Sparkle
                        className={'absolute right-0 bottom-2 size-4 text-yellow-800/50 sm:hidden'}
                      />
                    )}
                  </td>
                  <td className={`${tdStyling} text-[18px] max-md:hidden`}>
                    <span className={'line-clamp-3'}>{book.author}</span>
                  </td>
                  <td className={`text-right opacity-90 md:pr-2 md:text-left ${tdStyling}`}>
                    <TierSymbol
                      accuracyTier={book.accuracy_tier}
                      styling="inline size-5.75 sm:size-6"
                    />
                    <span className={'ml-1 hidden text-[18px] opacity-90 md:inline'}>
                      {TIER_LABELS[book.accuracy_tier]}
                    </span>
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
