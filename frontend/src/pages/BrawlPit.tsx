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
      fetchMatch()
    } catch (error) {
      setError('Failed to submit choice. Please try again.')
    }
  }

  if (loading) return <h1>Loading...</h1>
  if (error) return <h1>{error}</h1>
  if (!match) return null

  return (
    <main>
      <h1>Which means more to you?</h1>
      <div>
        <br />
        <button onClick={() => handleChoice(match.book_a.id, match.book_b.id)}>
          <p>{match.book_a.title}</p>
          <p>{match.book_a.author}</p>
        </button>
        <br />
        <br />
        <button onClick={() => handleChoice(match.book_b.id, match.book_a.id)}>
          <p>{match.book_b.title}</p>
          <p>{match.book_b.author}</p>
        </button>
      </div>
    </main>
  )
}
