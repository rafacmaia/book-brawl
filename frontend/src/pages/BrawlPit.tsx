import { useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import { apiFetch } from '../api.tsx'

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

  const longTextStyling =
    (longTitle && longAuthor) || veryLongTitle
      ? 'gap-3 px-6 py-4'
      : longTitle || longAuthor
        ? 'gap-4 px-8 py-4'
        : 'gap-6 px-8 py-4'

  const longTitleStyling =
    (longTitle && longAuthor) || veryLongTitle
      ? 'text-[40px]/13'
      : longTitle
        ? 'text-[42px]/14'
        : 'text-[44px]/16'

  const longAuthorStyling =
    longTitle && longAuthor
      ? 'text-[26px]'
      : longAuthor
        ? 'text-[28px]'
        : 'text-[30px]'

  const hoverStyling =
    'hover:-translate-y-2 hover:scale-[1.02] hover:border-primary/80 hover:bg-background hover:text-primary hover:shadow-2xl hover:brightness-110'

  return (
    <button
      className={`flex h-72 w-134 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-md border-3 border-accent/80 bg-button/90 font-calistoga wrap-break-word text-sky-900 shadow-lg transition-all duration-250 ${hoverStyling} ${longTextStyling}`}
      onClick={onClick}
    >
      <p className={`w-ful line-clamp-3 p-1 font-medium ${longTitleStyling}`}>
        {book.title}
      </p>
      <p
        className={`line-clamp-2 w-full font-zain font-light ${longAuthorStyling}`}
      >
        by <span className={various ? 'italic' : ''}>{book.author}</span>
      </p>
    </button>
  )
}

function Placeholder({ message }: { message: string }) {
  return (
    <div className={'flex grow items-center justify-center'}>
      <h1
        className={
          'font-gaegu text-5xl font-bold tracking-wide text-primary/90'
        }
      >
        {message}
      </h1>
    </div>
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

  if (loading) return <Placeholder message={'Loading...'} />
  if (error) return <Placeholder message={error} />
  if (!match) return null

  const wavyUnderline =
    'underline decoration-accent/80 decoration-wavy decoration-6 underline-offset-42'

  return (
    <main className="relative flex grow flex-col items-center">
      <h1
        className={`z-100 mt-36 text-center font-calistoga text-8xl font-extrabold tracking-wide text-primary/95 drop-shadow-md`}
      >
        Which means more to you?
      </h1>
      <h1
        className={`absolute z-0 mt-38 text-center font-calistoga text-8xl font-extrabold tracking-wide text-background ${wavyUnderline}`}
      >
        ich means more to yo
      </h1>
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
    </main>
  )
}
