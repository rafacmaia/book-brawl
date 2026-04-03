import { useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import { apiFetch } from '../api'
import { Placeholder } from '../components/Placeholder.tsx'

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
  const longTitle = book.title.length >= 38
  const veryLongTitle = book.title.length >= 76
  const longAuthor = book.author.length >= 30

  const various = book.author.trim().toLowerCase() === 'various'

  let longTextStyling: string, longTitleStyling: string, longAuthorStyling: string

  if ((longTitle && longAuthor) || veryLongTitle) {
    longTextStyling = 'gap-3 px-6 py-4'
    longTitleStyling = 'text-[40px]/13'
    longAuthorStyling = 'text-[26px]'
  } else if (longTitle || longAuthor) {
    longTextStyling = 'gap-4 px-8 py-4'
    longTitleStyling = longTitle ? 'text-[42px]/14' : 'text-[44px]/16'
    longAuthorStyling = longAuthor ? 'text-[28px]' : 'text-[30px]'
  } else {
    longTextStyling = 'gap-6 px-8 py-4'
    longTitleStyling = 'text-[44px]/16'
    longAuthorStyling = 'text-[30px]'
  }

  const hoverStyling =
    'hover:-translate-y-2 hover:scale-[1.02] hover:border-primary/80 hover:bg-background hover:text-primary hover:shadow-2xl hover:brightness-110'

  return (
    <button
      className={`flex h-72 w-134 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-md border-3 border-accent/80 bg-button/90 font-calistoga wrap-break-word text-sky-900 shadow-lg transition-all duration-250 ${hoverStyling} ${longTextStyling}`}
      onClick={onClick}
    >
      <p className={`line-clamp-3 w-full p-1 font-medium ${longTitleStyling}`}>{book.title}</p>
      <p className={`line-clamp-2 w-full font-zain font-light ${longAuthorStyling}`}>
        by <span className={various ? 'italic' : ''}>{book.author}</span>
      </p>
    </button>
  )
}

export default function BrawlPit() {
  const { getToken } = useAuth()

  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchMatch()
  }, [])

  async function fetchMatch() {
    setLoading(true)
    setError(null)

    try {
      const token = await getToken()

      const response = await apiFetch('/brawl', token!)
      const data = await response.json()
      setMatch(data)
    } catch (error) {
      setError('Failed to load match. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleChoice(winnerId: number, loserId: number) {
    try {
      const token = await getToken()
      await apiFetch('/brawl/resolve', token!, {
        method: 'POST',
        body: JSON.stringify({ winner_id: winnerId, loser_id: loserId }),
      })
      await fetchMatch()
    } catch (error) {
      setError('Failed to submit choice. Please try again.')
    }
  }

  const wavyUnderline =
    'underline decoration-accent/80 decoration-wavy decoration-8 underline-offset-42'

  return (
    <main className="relative flex grow flex-col items-center">
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
      ) : (
        match && (
          <div className="flex w-full grow items-center justify-center gap-26">
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
