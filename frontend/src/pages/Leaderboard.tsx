import { useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import { apiFetch } from '../api'
import Placeholder from '../components/Placeholder'
import PageHeading from '../components/PageHeading'
import { BadgeCheck, CircleAlert, Squircle } from 'lucide-react'
import { InformationCircleIcon as InfoCircleMini } from '@heroicons/react/16/solid'
import { InformationCircleIcon as InfoCircle } from '@heroicons/react/20/solid'
import { NavLink } from 'react-router-dom'
import { SparkleIcon, StarFourIcon, StarIcon, TrophyIcon, XCircleIcon } from '@phosphor-icons/react'

interface BookData {
  id: number
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
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="relative flex w-[90%] flex-col gap-4 rounded-lg border border-y-8 border-background bg-button/97 px-8 py-6 font-zain text-text shadow-2xl md:w-lg md:gap-6 md:rounded-md md:px-10 md:py-8">
        <h2 className="font-calistoga text-2xl font-bold text-text [@media(min-height:700px)]:text-3xl">
          Accuracy Tiers
        </h2>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 cursor-pointer font-extrabold text-red-700 transition-all hover:scale-112 active:scale-95 md:top-3 md:right-3"
        >
          <XCircleIcon weight={'duotone'} className="size-5.75 md:size-7" />
        </button>
        <div className="flex flex-col gap-2 text-base text-text/90 md:gap-3 [@media(min-height:700px)]:text-lg">
          <p className="">
            Accuracy measures how trustworthy a book's current rank is. The more a book brawls, the
            higher its rank accuracy.
          </p>
          <hr className="my-1 h-px border-background/60" />
          <table className="w-full table-fixed border-collapse [&_td]:p-1 max-sm:[&_td]:pl-1.5">
            <colgroup>
              <col className="w-1/10 align-top" />
              <col className="w-9/10" />
            </colgroup>
            <tbody>
              <tr>
                <td>
                  <TierSymbol
                    accuracyTier={1}
                    styling="size-6 [@media(min-height:700px)]:size-7 max-sm:-translate-x-1.25"
                  />
                </td>
                <td>
                  <span className={fieldStyling}>Very Low</span> – Just added, ranking mostly based
                  on any initial rating
                </td>
              </tr>
              <tr>
                <td>
                  <TierSymbol
                    accuracyTier={2}
                    styling="size-6 [@media(min-height:700px)]:size-7 max-sm:-translate-x-1.25"
                  />
                </td>
                <td>
                  <span className={fieldStyling}>Low</span> – Some brawls in, broad tier likely
                  correct (top/mid/bottom)
                </td>
              </tr>
              <tr>
                <td>
                  <TierSymbol
                    accuracyTier={3}
                    styling="size-6 [@media(min-height:700px)]:size-7 max-sm:-translate-x-1.25"
                  />
                </td>
                <td>
                  <span className={fieldStyling}>Moderate</span> – Position is fairly reliable,
                  exact rank still shifting
                </td>
              </tr>
              <tr>
                <td>
                  <TierSymbol
                    accuracyTier={4}
                    styling="size-6 [@media(min-height:700px)]:size-7 max-sm:-translate-x-1.25"
                  />
                </td>
                <td>
                  <span className={fieldStyling}>High</span> – Position is well established, likely
                  within ~5 spots
                </td>
              </tr>
              <tr>
                <td>
                  <TierSymbol
                    accuracyTier={5}
                    styling="size-6 [@media(min-height:700px)]:size-7 max-sm:-translate-x-1.25"
                  />
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

function RankIcon({ rank, mobile }: { rank: number; mobile: boolean }) {
  const baseClass = mobile
    ? 'absolute right-0.5 bottom-2 sm:hidden'
    : 'hidden -translate-y-px sm:inline'

  switch (rank) {
    case 1:
      return (
        <TrophyIcon
          weight="duotone"
          alt="First place trophy"
          className={`${baseClass} size-4.75 text-yellow-800/80`}
        />
      )
    case 2:
      return (
        <StarIcon
          weight="duotone"
          alt="Second place star"
          className={`${baseClass} size-4.25 text-yellow-800/65`}
        />
      )
    case 3:
      return (
        <SparkleIcon
          weight="duotone"
          alt="Third place star"
          className={`${baseClass} size-4.25 text-yellow-800/60`}
        />
      )
    case 4:
      return (
        <StarFourIcon
          weight="duotone"
          alt="Fourth place sparkle"
          className={`${baseClass} size-3.75 -translate-x-px text-yellow-800/50`}
        />
      )
    default:
      return null
  }
}

function LeaderboardContent({ progress, rankings }: { progress: number; rankings: BookData[] }) {
  const [showAccuracyModal, setShowAccuracyModal] = useState<boolean>(false)

  const thStyle = `px-2 pt-1.25 pb-1 first:pl-2 md:first:pl-5 text-base tracking-wider md:pb-1.25 md:pt-2 md:text-xl font-extrabold font-calistoga `
  const tdStyle = `md:py-2 py-1.25 first:pl-3 md:first:pl-6 last:max-md:pr-2.25 px-2`

  return (
    <>
      {showAccuracyModal && <AccuracyModal onClose={() => setShowAccuracyModal(false)} />}

      <div className={'mb-6 hidden md:block'}>
        <PageHeading title={'The Leaderboard'} />
      </div>
      <section className={'mt-3 flex w-full flex-col items-center gap-3 md:mt-2 md:gap-4'}>
        <div className="relative w-[99%] sm:max-w-279">
          <div className="h-7 w-full overflow-hidden rounded-full bg-primary/25 sm:h-8">
            <div
              className={`h-full rounded-xs bg-linear-to-r transition-all duration-500 ${progress > 0.33 ? 'from-green-600/90 via-button/90 to-red-500/90' : 'from-red-500/90 to-button/90'}`}
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p
            className={`absolute font-gaegu text-lg font-black tracking-wider text-primary/90 drop-shadow-2xl sm:text-lg ${progress > 0.66 ? 'bottom-0 left-4 sm:right-4 sm:bottom-0.5' : 'right-3 bottom-0 sm:right-4 sm:bottom-0.5'}`}
          >
            {Math.round(progress * 100)}% Complete
          </p>
        </div>
        <table className="w-full table-fixed border-collapse rounded-md bg-button text-text shadow-lg sm:max-w-280">
          <thead className={'text-left'}>
            <tr className={'border-b-2 border-red-800 md:border-b-3'}>
              <th className={`w-[10%] md:w-[10%] ${thStyle}`}>
                <span className={'lg:hidden'}>#</span>
                <span className={'hidden lg:inline'}>Rank</span>
              </th>
              <th className={`w-[74%] md:w-[46%] ${thStyle}`}>
                <span className={'sm:hidden'}>Book</span>
                <span className={'hidden sm:inline'}>Title</span>
              </th>
              <th className={`max-md:hidden md:w-[31%] ${thStyle}`}>Author</th>
              <th className={`w-[16%] text-right md:w-[13%] lg:text-left ${thStyle}`}>
                <button onClick={() => setShowAccuracyModal(true)} className={'inline-flex'}>
                  <span className={'lg:hidden'}>Acc.</span>
                  <span className={'hidden lg:inline'}>Accuracy</span>
                  <InfoCircleMini className={'size-3.5 shrink-0 -translate-x-0.5 lg:hidden'} />
                  <InfoCircle className={'ml-1 hidden size-4.25 shrink-0 lg:inline'} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className={'text-base opacity-95 sm:text-lg'}>
            {rankings.map((book) => (
              <tr
                key={book.id}
                className={`border-b border-red-800/80 last:border-none md:border-b-2`}
              >
                <td
                  className={`relative font-calistoga font-black ${tdStyle} ${book.rank < 100 ? 'max-sm:text-base' : book.rank < 1000 ? 'text-[0.9rem] max-sm:pl-2!' : 'max-sm:pl-1! max-sm:text-[0.8rem]'}`}
                >
                  <div className={'flex h-full items-center justify-between'}>
                    {book.rank}
                    {progress > 0.05 && <RankIcon rank={book.rank} mobile={false} />}
                  </div>
                </td>
                <td className={`relative ${tdStyle}`}>
                  <span className={`line-clamp-2 font-bold`}>{book.title}</span>
                  <span className="line-clamp-1 pr-3 font-zain text-[0.9rem] font-normal opacity-75 md:hidden">
                    {book.author}
                  </span>
                  {progress > 0.05 && <RankIcon rank={book.rank} mobile={true} />}
                </td>
                <td className={`${tdStyle} max-md:hidden`}>
                  <span className={'line-clamp-3'}>{book.author}</span>
                </td>
                <td className={`text-right opacity-90 sm:pr-4 lg:pr-2 lg:text-left ${tdStyle}`}>
                  <div onClick={() => setShowAccuracyModal(true)}>
                    <TierSymbol
                      accuracyTier={book.accuracy_tier}
                      styling="inline lg:-translate-y-0.5 size-5.75 sm:size-6"
                    />
                    <span className={'ml-1.25 hidden opacity-90 lg:inline'}>
                      {TIER_LABELS[book.accuracy_tier]}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  )
}

export default function Leaderboard() {
  const { getToken } = useAuth()

  const [rankings, setRankings] = useState<BookData[]>([])
  const [progress, setProgress] = useState<number>(0)

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

      if (rankingsData.length === 0) {
        setEmptyPit(true)
        return
      }

      setRankings(rankingsData)
      setProgress(progressData)
    } catch {
      setError('Failed to load leaderboard. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex h-full min-h-0 w-[97%] grow flex-col items-center gap-4 overflow-y-auto p-2 text-primary/95 md:gap-8 md:p-4">
      {loading ? (
        <Placeholder message={'Loading...'} />
      ) : error ? (
        <Placeholder message={error} />
      ) : emptyPit ? (
        <div
          className={
            'flex w-full grow flex-col items-center justify-center gap-0 text-center font-zain text-4xl/18 font-extrabold tracking-wide text-primary/85 sm:text-5xl/20 md:mb-12'
          }
        >
          <CircleAlert className={'mb-8 size-18 sm:size-20'} />
          <p>No books to show!</p>
          <p>
            <NavLink
              to={'/manage'}
              className={`font-black text-primary/90 underline decoration-accent/80 decoration-4 underline-offset-4 transition-all duration-350 hover:text-5xl hover:text-primary hover:decoration-wavy hover:underline-offset-8 sm:hover:text-6xl`}
            >
              Feed the Pit
            </NavLink>{' '}
            and try again.
          </p>
        </div>
      ) : (
        <LeaderboardContent progress={progress} rankings={rankings} />
      )}
    </main>
  )
}
