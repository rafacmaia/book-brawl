import { useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import { ApiError, apiFetch } from '../api'
import Placeholder from '../components/Placeholder'

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

  const longTitle = title.length >= 38
  const veryLongTitle = title.length >= 69
  const longAuthor = author.length >= 30

  const italic = /\b(?:anonymous|various)\b/i.test(author)

  let longTextStyling: string, longTitleStyling: string, longAuthorStyling: string

  if ((longTitle && longAuthor) || veryLongTitle) {
    longTextStyling = 'gap-4 px-7 py-3'
    longTitleStyling = 'text-[40px]/13'
    longAuthorStyling = 'text-[28px]/10'
  } else if (longTitle || longAuthor) {
    longTextStyling = 'gap-4 px-8 py-3'
    longTitleStyling = longTitle ? 'text-[42px]/14' : 'text-[44px]/14'
    longAuthorStyling = longAuthor ? 'text-[28px]/10' : 'text-[30px]'
  } else {
    longTextStyling = 'gap-6 px-8 py-4'
    longTitleStyling = 'text-[44px]/16'
    longAuthorStyling = 'text-[30px]'
  }

  const hoverStyling =
    'hover:-translate-y-2 hover:scale-[1.02] hover:border-primary/80 hover:bg-background hover:text-primary hover:shadow-2xl hover:brightness-110'

  return (
    <button
      className={`flex h-72 w-134 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-md border-3 border-accent/80 bg-button/95 font-calistoga wrap-break-word text-text shadow-lg transition-all duration-250 active:scale-99 ${hoverStyling} ${longTextStyling}`}
      onClick={onClick}
    >
      <p className={`line-clamp-3 w-full p-1 font-medium ${longTitleStyling}`}>{title}</p>
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
    'underline decoration-accent/80 decoration-wavy decoration-8 underline-offset-42'

  return (
    <main className="relative flex grow flex-col items-center text-primary/95">
      <h1
        className={`z-100 mt-24 text-center font-calistoga text-7xl font-extrabold tracking-wide text-primary/95 drop-shadow-md`}
      >
        Which means more to you?
      </h1>
      <h1
        className={`absolute z-0 mt-24 text-center font-calistoga text-7xl font-extrabold tracking-wide text-background ${wavyUnderline}`}
      >
        ===============
      </h1>
      {loading ? (
        <Placeholder message={'Loading...'} />
      ) : error ? (
        <Placeholder message={error} />
      ) : emptyPit ? (
        <Placeholder message={'Not enough books to brawl! Feed the Pit and try again.'} />
      ) : (
        match && (
          <div
            className={`${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'} flex w-full grow items-center justify-center gap-27 transition-all duration-300 ease-in-out`}
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
        )
      )}
    </main>
  )
}
