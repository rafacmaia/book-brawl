import { useAuth } from '@clerk/react'
import { useState } from 'react'

import { ApiError, apiFetch, DEFAULT_ERROR_MESSAGE } from '@/api/client'
import type { Book, BookData } from '@/api/types'

export type AddState =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'error'; message: string }
  | { type: 'success'; book: Book }

export function useAddBook() {
  const { getToken } = useAuth()

  const [state, setState] = useState<AddState>({ type: 'idle' })

  async function addBook(
    title: string,
    author: string,
    rating: number | null
  ): Promise<Book | null> {
    if (!title.trim() || !author.trim()) {
      setState({ type: 'error', message: 'Please enter both title and author.' })
      return null
    }

    if (rating !== null && (isNaN(rating) || rating < 1 || rating > 10)) {
      setState({ type: 'error', message: 'Rating must be between 1 and 10.' })
      return null
    }

    setState({ type: 'loading' })

    try {
      const token = await getToken()

      const body: BookData = {
        title: title.trim(),
        author: author.trim(),
        rating: rating,
      }

      const response = await apiFetch('/stacks', token!, {
        method: 'POST',
        body: JSON.stringify(body),
      })

      const newBook: Book = await response.json()

      setState({ type: 'success', book: newBook })

      return newBook
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setState({
          type: 'error',
          message: `${title}, by ${author}, is already in the pit!`,
        })
      } else if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        setState({
          type: 'error',
          message: err.message,
        })
      } else {
        console.error('Unexpected error adding book:', { title, author, err })
        setState({
          type: 'error',
          message: DEFAULT_ERROR_MESSAGE,
        })
      }

      return null
    }
  }

  function reset() {
    setState({ type: 'idle' })
  }

  return { addBook, state, reset }
}
