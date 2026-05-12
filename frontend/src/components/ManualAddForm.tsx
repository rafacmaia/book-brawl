import { type KeyboardEvent, type SubmitEvent, useRef } from 'react'
import { type AddState } from '../hooks/useAddBook'
import ManualAddFeedback from './feedback/ManualAddFeedback'
import type { Book } from '../types'

interface Props {
  addState: AddState
  addBook: (title: string, author: string, rating: number | null) => Promise<Book | null>
  onSuccess?: (book: Book) => void
  variant?: 'default' | 'compact'
}

const styles = {
  default: {
    form: 'gap-3',
    input:
      'rounded-md text-base border-b-3 border-primary/85 bg-blue-200 py-2.5 px-3 sm:p-2 shadow-lg',
    button: 'text-lg',
  },
  compact: {
    form: 'gap-2',
    input: 'rounded-md text-sm border-b-3 border-primary/85 bg-blue-200 py-2 px-3 sm:p-2 shadow-lg',
    button: 'text-base',
  },
}

export function ManualAddForm({ addState, addBook, onSuccess, variant = 'default' }: Props) {
  const style = styles[variant]

  const titleRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const title = formData.get('title') as string
    const author = formData.get('author') as string
    const rating = formData.get('rating') as string
    const parsedRating = rating ? parseFloat(rating) : null

    const newBook = await addBook(title, author, parsedRating)

    if (newBook) {
      onSuccess?.(newBook)
      form.reset()
      titleRef.current?.focus()
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.requestSubmit()
    }
  }

  return (
    <>
      <form
        className={`flex w-full flex-col justify-between font-calistoga font-bold text-text sm:text-lg md:flex-row md:gap-0 ${style.form}`}
        onKeyDown={handleKeyDown}
        onSubmit={handleSubmit}
      >
        <input
          aria-label="Enter book title"
          type="text"
          placeholder="Title"
          name="title"
          ref={titleRef}
          className={`md:w-[48%] ${style.input}`}
        />
        <input
          aria-label="Enter book author"
          type="text"
          placeholder="Author"
          name="author"
          className={`md:w-[30%] ${style.input}`}
        />
        <input
          aria-label="Enter optional rating (1-10, decimals welcome)"
          type="number"
          min="1"
          max="10"
          step="0.01"
          placeholder="Rating"
          name="rating"
          className={`md:w-[11%] ${style.input}`}
        />
        <button
          type="submit"
          title={'Add new book'}
          className={`cursor-pointer rounded-md border-b-3 border-primary/75 bg-accent/80 pt-2.25 pb-1.5 text-center font-zain font-extrabold text-primary/90 shadow-md transition-all hover:scale-102 hover:bg-accent/85 active:scale-97 active:bg-accent/70 md:w-[8%] md:bg-accent/75 md:pt-1.75 md:pb-0.75 md:text-xl ${style.button}`}
        >
          <span className="inline md:hidden">Add Book</span>
          <span className="hidden md:inline">Add</span>
        </button>
      </form>
      <ManualAddFeedback addState={addState} variant={variant} />
    </>
  )
}
