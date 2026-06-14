import type { Book } from '../types'
import { useAuth } from '@clerk/react'
import { useState } from 'react'
import { ApiError, apiFetch } from '../api'
import { ApiError, apiFetch } from '../api/client'

import { ApiError, apiFetch } from '@/api/client'

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

      const response = await apiFetch('/stacks', token!, {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim(),
          rating: rating,
        }),
      })

      const newBook = await response.json()

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
          message: `Something went wrong. Please try again.`,
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
