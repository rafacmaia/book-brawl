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
  return (
    <button
      className={
        'flex h-36 min-h-28 w-80 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-3 border-accent bg-button p-6 px-6 py-4 font-calistoga text-slate-800 shadow-md transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:bg-background hover:text-primary hover:shadow-lg hover:brightness-120'
      }
      onClick={onClick}
    >
      <p className={'line-clamp-2 text-xl font-bold wrap-break-word'}>
        {book.title}
      </p>
      <p className={'line-clamp-2 font-gaegu text-xl wrap-break-word'}>
        by <span>{book.author}</span>
      </p>
    </button>
  )
}

function Placeholder({ message }: { message: string }) {
  return (
    <div className={'flex grow items-center justify-center'}>
      <h1 className={'font-gaegu text-4xl font-medium text-primary'}>
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

  return (
    <main className="flex grow flex-col items-center justify-center gap-16">
      <h1
        className={
          'font-zain text-6xl font-extrabold tracking-wide text-primary underline decoration-accent/60 decoration-wavy decoration-4 underline-offset-9 drop-shadow-md'
        }
      >
        Which means more to you?
      </h1>
      <div className="flex items-center gap-20">
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
