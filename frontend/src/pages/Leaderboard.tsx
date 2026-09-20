import { useAuth } from '@clerk/react'
import {
  BookIcon,
  SparkleIcon,
  StarFourIcon,
  StarIcon,
  TrophyIcon,
  XCircleIcon,
} from '@phosphor-icons/react'
import { BadgeCheck, Squircle, Swords } from 'lucide-react'
import { useEffect, useEffectEvent, useState } from 'react'
import { NavLink } from 'react-router-dom'

import { apiFetch } from '@/api/client'
import type { Progress, Rankings } from '@/api/types'
import { EmptyStateMessage } from '@/components/feedback/EmptyStateMessage'
import PlaceholderMessaging from '@/components/feedback/PlaceholderMessaging'

// ====== CONSTANTS

// Progress bar labels. The first values represent the upper threshold of each label.
// Keep labels under 30 char to avoid layout shifts.
const PROGRESS_LABELS: [number, string][] = [
  [0.1, 'Early days'],
  [0.2, 'Brawl pit warming up'],
  [0.3, 'Heavy brawling underway'],
  [0.4, 'Leave no book unbrawled!'],
  [0.6, 'Cooking'],
  [0.7, 'Books settling into place'],
  [0.8, 'Final brawls underway'],
  [0.9, 'Locking in'],
  [0.97, 'Nearly brawled out!'],
  [Infinity, 'The brawl pit has spoken!'],
]

// The threshold above which the rankings are considered settled. The exact percentage is then
// hidden, and the progress bar is displayed as completed.
const FINAL_THRESHOLD = PROGRESS_LABELS[PROGRESS_LABELS.length - 2][0] // second-to-last threshold

// ====== MAIN PAGE

export default function Leaderboard() {
  const { getToken } = useAuth()

  const [rankings, setRankings] = useState<Rankings>([])
  const [progress, setProgress] = useState<number>(0)

  const [emptyPit, setEmptyPit] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeaderboard = useEffectEvent(async () => {
    setLoading(true)
    setError(null)

    try {
      const token = await getToken()

      const [rankingsRes, progressRes] = await Promise.all([
        apiFetch('/leaderboard', token!),
        apiFetch('/progress', token!),
      ])

      const rankingsData: Rankings = await rankingsRes.json()
      const { progress }: Progress = await progressRes.json()

      if (rankingsData.length === 0) {
        setEmptyPit(true)
        return
      }

      setRankings(rankingsData)
      setProgress(progress)
    } catch (err) {
      console.error('Failed to fetch the leaderboard:', err)
      setError('Failed to fetch the leaderboard. Please refresh to try again.')
    } finally {
      setLoading(false)
    }
  })

  useEffect(() => {
    void fetchLeaderboard()
  }, [])

  return (
    <main className="mx-auto flex h-full min-h-0 w-[97%] grow flex-col items-center gap-4 overflow-y-auto p-1 pt-px text-primary/95 md:gap-8 md:p-4">
      {loading ? (
        <PlaceholderMessaging message={'Loading...'} />
      ) : error ? (
        <PlaceholderMessaging message={error} />
      ) : emptyPit ? (
        <EmptyStateMessage message={'No books to show!'} />
      ) : progress < 0.002 ? ( // Leaderboard blocked until some minimum progress has been made.
        <div
          className={
            'flex w-full grow flex-col items-center justify-center gap-4 px-2 text-center font-zain text-[2.6rem]/15 font-extrabold tracking-wider text-balance text-primary/85 sm:text-5xl/20 md:mb-12 md:w-2xl'
          }
        >
          <div className="mb-4 flex items-center justify-center gap-4 md:gap-6">
            <BookIcon className={'size-12 sm:size-16'} weight={'duotone'} />
            <Swords className={'size-14 sm:size-20'} />
            <BookIcon className={'size-12 -scale-x-100 sm:size-16'} weight={'duotone'} />
          </div>
          <p>
            Books must{' '}
            <NavLink
              className={`font-black text-primary/90 underline decoration-accent/80 decoration-4 underline-offset-4 transition-all duration-350 hover:text-5xl hover:text-primary hover:decoration-wavy hover:underline-offset-8 sm:hover:text-6xl`}
              to={'/brawl'}
            >
              Brawl
            </NavLink>{' '}
            first!
          </p>
        </div>
      ) : (
        <LeaderboardContent progress={progress} rankings={rankings} />
      )}
    </main>
  )
}

// ====== SUBCOMPONENTS

// Renders the actual leaderboard once data is loaded. Split out from the Leaderboard so the main
// component can focus on routing between loading/error/empty/content states.
function LeaderboardContent({ progress, rankings }: { progress: number; rankings: Rankings }) {
  const [showAccuracyModal, setShowAccuracyModal] = useState<boolean>(false)

  const showProgress = Math.round(progress * 100) / 100 < FINAL_THRESHOLD
  const progressLabel = PROGRESS_LABELS.find(
    ([threshold]) => Math.round(progress * 100) / 100 < threshold
  )![1]

  return (
    <>
      {showAccuracyModal && <AccuracyModal onClose={() => setShowAccuracyModal(false)} />}

      <section className={'mt-3 flex w-full flex-col items-center gap-3 md:mt-2 md:gap-4'}>
        <div className="relative w-full sm:max-w-180">
          <div className="mx-auto h-7 w-full overflow-hidden rounded-md bg-primary/25 sm:h-8 sm:w-full">
            <div
              className={`h-full rounded-xs bg-linear-to-r transition-all duration-500 ${progress > 0.33 ? 'from-green-600/90 via-button/90 to-red-500/90' : 'from-red-500/90 to-button/90'}`}
              style={{
                width: `${showProgress ? Math.round(progress * 100) : 100}%`,
                maskImage:
                  progress < 0.9
                    ? 'linear-gradient(to right, black 80%, transparent 100%)'
                    : showProgress
                      ? 'linear-gradient(to right, black 90%, transparent 100%)'
                      : undefined,
                WebkitMaskImage:
                  progress < 0.9
                    ? 'linear-gradient(to right, black 80%, transparent 100%)'
                    : showProgress
                      ? 'linear-gradient(to right, black 90%, transparent 100%)'
                      : undefined,
              }}
            />
          </div>
          <p
            className={`absolute right-4 bottom-px font-gaegu text-[1.05rem] font-black tracking-wider text-primary/95 md:bottom-0.5 md:text-xl`}
            style={{
              textShadow:
                '0 1px 3px rgba(0,0,0,0.6), 0 0px 6px rgba(0,0,0,0.4), 0 0 8px rgba(0,0,0,0.3)',
            }}
          >
            {showProgress && `${Math.round(progress * 100)}% | `}
            <span className={'ml-2 font-gaegu text-lg font-black md:text-xl'}>{progressLabel}</span>
          </p>
        </div>

        <table className="w-full table-fixed border-collapse rounded-md bg-button/95 text-text shadow-xl sm:max-w-180">
          <tbody className={'opacity-95 sm:text-lg'}>
            {rankings.map((book) => (
              <tr key={book.id} className={`border-b border-text last:border-none md:border-b-2`}>
                <td className={`relative px-1.25 py-1.25 md:px-1.75 md:py-1.75`}>
                  <div className={'flex h-full gap-2.5 md:gap-3.5'}>
                    {book.cover_url ? (
                      <img
                        alt={`Cover of "${book.title}"`}
                        src={book.cover_url}
                        className={
                          'w-14 shrink-0 rounded-l-xs rounded-r-lg object-cover shadow-lg brightness-105 md:w-16'
                        }
                      />
                    ) : (
                      <div
                        className={`w-14 shrink-0 rounded-l-sm rounded-r-xl bg-gray-100/20 md:w-16`}
                      ></div>
                    )}
                    <div className={'flex flex-col items-start justify-between'}>
                      <span
                        className={`mb-2 rounded-md rounded-br-3xl bg-background pt-px pr-5 pb-0.5 pl-2 font-calistoga text-[1rem] font-black text-primary md:text-base`}
                      >
                        {progress > 0.05 && <RankIcon rank={book.rank} />}# {book.rank}
                      </span>
                      <div>
                        <span
                          className={`mb-0.75 line-clamp-2 font-calistoga text-[1.15rem] leading-tight text-pretty md:text-[1.4rem]`}
                        >
                          {book.title}
                        </span>
                        <span
                          className={
                            'line-clamp-1 pr-3 font-zain text-[0.9rem] leading-tight font-normal italic opacity-75 md:text-[1.1rem]'
                          }
                        >
                          {book.author}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    className={
                      'absolute top-2 right-3 cursor-pointer transition-transform hover:scale-120'
                    }
                    onClick={() => setShowAccuracyModal(true)}
                  >
                    <TierSymbol
                      accuracyTier={book.accuracy_tier}
                      styling="inline lg:-translate-y-0.5 size-5.25 sm:size-5.5"
                    />
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

function AccuracyModal({ onClose }: { onClose: () => void }) {
  const fieldStyling = 'font-bold'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative flex w-[90%] flex-col gap-4 rounded-lg border border-y-8 border-background bg-button/97 px-8 py-6 font-zain text-text shadow-2xl md:w-lg md:gap-6 md:rounded-md md:px-10 md:py-8">
        <h2 className="font-calistoga text-2xl font-bold text-text [@media(min-height:700px)]:text-3xl">
          Accuracy Tiers
        </h2>
        <button
          className="absolute top-2 right-2 cursor-pointer font-extrabold text-red-700 transition-all hover:scale-112 active:scale-95 md:top-3 md:right-3"
          onClick={onClose}
        >
          <XCircleIcon className="size-5.75 md:size-7" weight={'duotone'} />
        </button>
        <div className="flex flex-col gap-2 text-base text-text/90 md:gap-3 [@media(min-height:700px)]:text-lg">
          <p className="">
            Accuracy measures how much you can trust a book's current rank. The more a book brawls,
            the higher its rank accuracy.
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
                  <span className={fieldStyling}>Very Low</span> – Fresh entry! Very few brawls in.
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
                  correct (top/mid/bottom).
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
                  <p className={'text-pretty'}>
                    <span className={fieldStyling}>Moderate</span> – Reliable position, but exact
                    rank still shifting.
                  </p>
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
                  <span className={fieldStyling}>High</span> – Veteran brawler! Might flip a couple
                  ranks at most.
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
                  <span className={fieldStyling}>Very High</span> – Locked in, unlikely to shift
                  until new contenders arrive!
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ====== HELPERS

function TierSymbol({ accuracyTier, styling }: { accuracyTier: number; styling: string }) {
  if (accuracyTier === 1) {
    return <Squircle className={`fill-red-500/90 ${styling}`} stroke={'none'} />
  } else if (accuracyTier === 2) {
    return <Squircle className={`fill-orange-500/90 ${styling}`} stroke={'none'} />
  } else if (accuracyTier === 3) {
    return <Squircle className={`fill-yellow-600/85 ${styling}`} stroke={'none'} />
  } else if (accuracyTier === 4) {
    return <Squircle className={`fill-green-600/90 ${styling}`} stroke={'none'} />
  } else if (accuracyTier === 5) {
    return <BadgeCheck className={`text-sky-700/90 ${styling}`} strokeWidth={3} />
  } else {
    return null
  }
}

// Icons highlight the top 4 in the leaderboard.
function RankIcon({ rank }: { rank: number }) {
  // const baseClass = 'absolute right-3 bottom-2'
  const baseClass = 'inline mr-1.5 -translate-y-px'

  switch (rank) {
    case 1:
      return (
        <TrophyIcon
          alt="First place trophy"
          className={`${baseClass} size-4.75 text-primary`}
          weight="duotone"
        />
      )
    case 2:
      return (
        <StarIcon
          alt="Second place star"
          className={`${baseClass} size-4.25 text-primary/95`}
          weight="duotone"
        />
      )
    case 3:
      return (
        <SparkleIcon
          alt="Third place star"
          className={`${baseClass} size-4.25 text-primary/85`}
          weight="duotone"
        />
      )
    case 4:
      return (
        <StarFourIcon
          alt="Fourth place sparkle"
          className={`${baseClass} size-3.75 text-primary/80`}
          weight="duotone"
        />
      )
    default:
      return null
  }
}
