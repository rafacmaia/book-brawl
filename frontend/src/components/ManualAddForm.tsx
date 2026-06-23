import { type KeyboardEvent, type SubmitEvent, useRef } from 'react'

import ManualAddFeedback from './feedback/ManualAddFeedback'

import type { Book } from '@/api/types'
import { type AddState } from '@/hooks/useAddBook'

const styles = {
  default: {
    form: 'gap-3 flex w-full flex-col justify-between font-bold text-text sm:text-lg md:flex-row md:gap-0',
    input:
      'rounded-md text-base border-b-3 font-calistoga border-primary/85 bg-blue-200 py-2.5 px-3 sm:p-2 sm:pl-3 shadow-lg',
    button:
      'text-lg cursor-pointer rounded-md border-b-3 border-primary/75 bg-accent/80 pt-2.25 pb-1.5 text-center font-zain font-extrabold text-primary/90 shadow-md transition-all hover:scale-102 hover:bg-accent/85 active:scale-97 active:bg-accent/70 md:w-[8%] md:bg-accent/75 md:pt-1.75 md:pb-0.75 md:text-xl',
  },
  compact: {
    form: 'gap-2 flex w-full flex-col font-bold text-text md:gap-2.5',
    input:
      'rounded-lg text-sm border-b-3 border-primary/85 bg-blue-200 py-2 px-3 shadow-lg md:text-base md:py-2.5 font-calistoga ',
    button:
      'text-base cursor-pointer rounded-lg w-full border-b-3 border-primary/75 bg-accent/80 pt-2 pb-1.5 text-center font-zain font-extrabold text-primary/90 shadow-md transition-all hover:scale-102 hover:bg-accent/85 active:scale-97 active:bg-accent/70 md:bg-accent/75 md:text-xl md:pt-2.5',
  },
}

interface Props {
  addState: AddState
  addBook: (title: string, author: string, rating: number | null) => Promise<Book | null>
  onSuccess?: (book: Book) => void
  variant?: 'default' | 'compact'
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
      <form className={style.form} onKeyDown={handleKeyDown} onSubmit={handleSubmit}>
        <input
          aria-label="Enter book title"
          type="text"
          placeholder="Title"
          name="title"
          ref={titleRef}
          className={`${variant === 'default' ? 'md:w-[48%]' : 'w-full'} ${style.input}`}
        />
        <input
          aria-label="Enter book author"
          type="text"
          placeholder="Author"
          name="author"
          className={`${variant === 'default' ? 'md:w-[30%]' : 'w-full'} ${style.input}`}
        />
        <input
          aria-label="Enter optional rating (1-10, decimals welcome)"
          type="number"
          min="1"
          max="10"
          step="0.01"
          placeholder="Rating"
          name="rating"
          className={`${variant === 'default' ? 'md:w-[11%]' : 'w-full'} ${style.input}`}
        />
        <button type="submit" title={'Add new book'} className={style.button}>
          <span className={`inline ${variant === 'default' && 'md:hidden'} `}>Add Book</span>
          {variant === 'default' && <span className="hidden md:inline">Add</span>}
        </button>
      </form>
      <ManualAddFeedback addState={addState} variant={variant} />
    </>
  )
}
