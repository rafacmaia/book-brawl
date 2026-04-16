import { useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import { ApiError, apiFetch } from '../api'
import Placeholder from '../components/Placeholder'
import { CircleAlert } from 'lucide-react'
import { NavLink } from 'react-router-dom'

interface Book {
  id: number
  title: string
  author: string
}

interface Match {
  book_a: Book
  book_b: Book
}

function BookButton({ book, onClick }: { book: Book; onClick: () => void }) {
  const title = book.title.trim()
  const author = book.author.trim()

  const longTitle = title.length >= 37
  const veryLongTitle = title.length >= 69
  const longAuthor = author.length >= 30

  const italic = /\b(?:anonymous|various)\b/i.test(author)

  let longTextStyling: string, longTitleStyling: string, longAuthorStyling: string

  if ((longTitle && longAuthor) || veryLongTitle) {
    longTextStyling = ' gap-3 px-4 sm:gap-4 sm:px-7 sm:py-3'
    longTitleStyling = 'text-[32px]/10 sm:text-[40px]/13'
    longAuthorStyling = 'text-[22px]/8 sm:text-[28px]/10'
  } else if (longTitle || longAuthor) {
    longTextStyling = 'gap-3 px-5 sm:gap-4 sm:px-8 sm:py-3'
    longTitleStyling = longTitle
      ? 'text-[32px]/10 sm:text-[42px]/14'
      : 'text-[34px]/10 sm:text-[44px]/14'
    longAuthorStyling = longAuthor
      ? 'text-[22px]/8 sm:text-[28px]/10'
      : 'text-[24px] sm:text-[30px]'
  } else {
    longTextStyling = 'gap-5 px-6 sm:gap-6 sm:px-8 sm:py-4'
    longTitleStyling = 'text-[34px]/11 sm:text-[44px]/16'
    longAuthorStyling = 'text-[24px] sm:text-[30px]'
  }

  const hoverStyling =
    'sm:hover:-translate-y-2 sm:hover:scale-[1.02] sm:hover:border-primary/80 sm:hover:bg-background sm:hover:text-primary sm:hover:shadow-2xl sm:hover:brightness-110 active:scale-95 active:border-primary/80 active:bg-background active:text-primary active:shadow-2xl'

  return (
    <button
      className={`flex w-10/11 flex-1 basis-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-5 border-accent/80 bg-button/95 py-2 font-calistoga wrap-break-word text-text shadow-lg transition-all duration-250 sm:h-72 sm:w-134 sm:flex-none sm:rounded-md sm:border-3 ${hoverStyling} ${longTextStyling}`}
      onClick={onClick}
    >
      <p className={`line-clamp-4 w-full p-1 font-medium sm:line-clamp-3 ${longTitleStyling}`}>
        {title}
      </p>
      <p className={`line-clamp-2 w-full font-zain font-light ${longAuthorStyling}`}>
        by <span className={italic ? 'italic' : ''}>{author}</span>
      </p>
    </button>
  )
}

export default function BrawlPit() {
  const { getToken } = useAuth()

  const [match, setMatch] = useState<Match | null>(null)
  const [nextMatch, setNextMatch] = useState<Match | null>(null)
  const [emptyPit, setEmptyPit] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    void (async () => {
      const token = await getToken()
      const [first, second] = await Promise.all([fetchMatch(token!), fetchMatch(token!)])

      setMatch(first ?? null)
      setLoading(false)
      requestAnimationFrame(() => setVisible(true))
      setNextMatch(second ?? null)
    })()
  }, [])

  async function fetchMatch(token: string) {
    try {
      const response = await apiFetch('/brawl', token!)
      return await response.json()
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setEmptyPit(true)
      } else {
        setError('Failed to load brawl, please try again!')
      }
    }
  }

  async function handleChoice(winnerId: number, loserId: number) {
    setError(null)

    if (nextMatch) {
      setVisible(false)
      await new Promise((resolve) => setTimeout(resolve, 300))
      setMatch(nextMatch)
      await new Promise((resolve) => setTimeout(resolve, 50))
      setVisible(true)

      setNextMatch(null)
    }

    try {
      const token = await getToken()

      const [_, next] = await Promise.all([
        apiFetch('/brawl/resolve', token!, {
          method: 'POST',
          body: JSON.stringify({ winner_id: winnerId, loser_id: loserId }),
        }),
        fetchMatch(token!),
      ])

      setNextMatch(next)
    } catch (error) {
      setError('Something went wrong. Please try again.')
    }
  }

  const wavyUnderline =
    'underline decoration-accent/80 decoration-wavy decoration-5 sm:decoration-8 underline-offset-46 sm:underline-offset-42'

  return (
    <main className="relative flex grow flex-col items-center px-4 text-primary/95">
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
          <p>Not enough books to brawl!</p>
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
        match && (
          <>
            <h1
              className={`z-100 mt-4 text-center font-calistoga text-[52px]/18 font-extrabold tracking-wide text-primary/95 drop-shadow-md sm:mt-24 sm:text-7xl`}
            >
              Which means more to you?
            </h1>
            <h1
              className={`absolute z-0 mt-24 hidden text-center font-calistoga text-5xl font-extrabold tracking-wide text-background sm:block sm:text-7xl ${wavyUnderline}`}
            >
              ===============
            </h1>
            <div
              className={`${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-1 opacity-0 sm:translate-y-3'} mt-7 mb-2 flex w-full grow flex-col items-center justify-center gap-8 transition-all duration-300 ease-in-out sm:my-0 sm:flex-row sm:gap-27`}
            >
              <BookButton
                book={match.book_a}
                onClick={() => handleChoice(match.book_a.id, match.book_b.id)}
              />
              <BookButton
                book={match.book_b}
                onClick={() => handleChoice(match.book_b.id, match.book_a.id)}
              />
            </div>
          </>
        )
      )}
    </main>
  )
}
