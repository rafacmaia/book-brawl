import { useAuth } from '@clerk/react'
import { FireIcon as FireOutline } from '@heroicons/react/24/outline'
import { FireIcon as FireSolid } from '@heroicons/react/24/solid'
import { BombIcon, CloudArrowUpIcon, PencilSimpleLineIcon } from '@phosphor-icons/react'
import { useEffect, useEffectEvent, useState } from 'react'

import { ApiError, apiFetch, DEFAULT_ERROR_MESSAGE } from '@/api/client'
import type { Book, BookData, Library } from '@/api/types'
import goodreadsLogo from '@/assets/goodreads-logo-1.svg'
import PlaceholderMessaging from '@/components/feedback/PlaceholderMessaging'
import { ManualAddForm } from '@/components/ManualAddForm'
import {
  DeleteModal,
  EditModal,
  ImportCSVModal,
  ImportGoodreadsModal,
  ResetModal,
} from '@/components/StacksModals'
import PageHeading from '@/components/ui/PageHeading'
import { useAddBook } from '@/hooks/useAddBook'

export default function TheStacks() {
  const { getToken } = useAuth()
  const { state: addState, addBook, reset: resetAddState } = useAddBook()

  const [books, setBooks] = useState<Library>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [bookToBurn, setBookToBurn] = useState<Book | null>(null)
  const [burnError, setBurnError] = useState<string | null>(null)
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [resetError, setResetError] = useState<string | null>(null)

  const [openModal, setOpenModal] = useState<'csv' | 'goodreads' | 'reset' | null>(null)

  // --- data fetching
  async function fetchBooks() {
    setLoading(true)
    setError(null)

    try {
      const token = await getToken()

      const response = await apiFetch('/stacks', token!)

      const data: Library = await response.json()
      setBooks(data)
    } catch {
      setError('Failed to load books. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // --- effects
  const loadBooks = useEffectEvent(() => fetchBooks())

  useEffect(() => {
    void loadBooks()
  }, [])

  // After CSV imports, clear any UI manual entry messaging and refresh the user's book list.
  function handleImportSuccess() {
    resetAddState()

    void fetchBooks()
  }

  // --- handlers
  async function handleBurn(book: Book) {
    resetAddState()

    try {
      const token = await getToken()

      await apiFetch(`/stacks/${book.id}`, token!, { method: 'DELETE' })
    } catch (err) {
      // Ignore 404 errors (book has already been deleted)
      if (!(err instanceof ApiError && err.status === 404)) {
        setBurnError('Failed to burn book! Please refresh and try again.')
        return
      }
    }

    setBooks((prev) => prev.filter((b) => b.id !== book.id))
    setBurnError(null)
    setBookToBurn(null)
  }

  async function handleEdit(title: string, author: string) {
    resetAddState()
    if (!bookToEdit) return

    title = title.trim()
    author = author.trim()

    // Don't trigger edit if the title and author have not been changed.
    if (title === bookToEdit.title && author === bookToEdit.author) {
      setBookToEdit(null)
      return
    }

    try {
      const token = await getToken()

      const body: BookData = { title, author, rating: null }

      await apiFetch(`/stacks/${bookToEdit.id}`, token!, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })

      setBooks((prev) =>
        prev.map((b) => (b.id === bookToEdit.id ? { ...b, title: title, author: author } : b))
      )
      setBookToEdit(null)
      setEditError(null)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setEditError(`${title}, by ${author}, is already in the brawl pit!`)
      } else if (err instanceof ApiError && err.status === 404) {
        setEditError('Book not found! Please refresh and try again.')
      } else {
        setEditError(DEFAULT_ERROR_MESSAGE)
      }
    }
  }

  async function handleReset() {
    resetAddState()

    try {
      const token = await getToken()

      await apiFetch('/stacks', token!, { method: 'DELETE' })

      setBooks([])
      setResetError(null)
      setOpenModal(null)
    } catch {
      setResetError('Failed to reset! Please refresh and try again.')
    }
  }

  // --- styles
  const cellXPadding = 'first:pl-2.25 lg:px-2 lg:first:pl-4'
  const thStyle = `font-calistoga text-base tracking-wider pt-1.5 lg:pt-2 lg:pb-1.5 pb-1.25 font-extrabold md:text-lg lg:text-xl  ${cellXPadding}`
  const tdStyle = `py-1.25 lg:py-1.75 ${cellXPadding}`

  return (
    <main className="mx-auto flex h-full min-h-0 w-[97%] grow flex-col items-center gap-4 overflow-y-auto px-2 pb-2 text-primary/95 sm:max-w-6xl sm:gap-4 md:p-4">
      <PageHeading title={'The Stacks'} style={'mb-5 mt-2 max-md:hidden'} />

      {openModal === 'csv' && (
        <ImportCSVModal onClose={() => setOpenModal(null)} onImportSuccess={handleImportSuccess} />
      )}

      {openModal === 'goodreads' && (
        <ImportGoodreadsModal
          onClose={() => setOpenModal(null)}
          onImportSuccess={handleImportSuccess}
        />
      )}

      {openModal === 'reset' && (
        <ResetModal
          onConfirm={handleReset}
          onCancel={() => {
            setOpenModal(null)
            setResetError(null)
          }}
          error={resetError}
        />
      )}

      {bookToEdit && (
        <EditModal
          book={bookToEdit}
          onConfirm={handleEdit}
          onCancel={() => {
            setBookToEdit(null)
            setEditError(null)
          }}
          error={editError}
        />
      )}

      {bookToBurn && (
        <DeleteModal
          book={bookToBurn}
          onConfirm={() => handleBurn(bookToBurn)}
          onCancel={() => {
            setBookToBurn(null)
            setBurnError(null)
          }}
          error={burnError}
        />
      )}

      {error ? (
        <PlaceholderMessaging message={error} />
      ) : loading ? (
        <PlaceholderMessaging message="Fetching the Stacks..." />
      ) : (
        <>
          {/* MANUAL INPUT */}
          <section
            className={`mt-0 flex w-full flex-col gap-4 [@media(min-height:700px)]:mt-1.5 [@media(min-height:700px)]:md:mt-2 ${addState.type === 'idle' ? 'md:mb-15' : 'mb-0'}`}
          >
            <h2 className="pl-px font-calistoga text-[1.6rem] font-bold tracking-wide drop-shadow-md sm:mb-2 [@media(min-height:700px)]:text-3xl">
              New Reads
            </h2>
            <p
              className={`rounded-md bg-button/95 px-4 py-3 text-base font-medium text-pretty text-text/90 sm:text-lg sm:tracking-wide sm:text-text`}
            >
              <span className={`font-extrabold decoration-accent/80`}>Rating</span> (1-10, decimals
              welcome) is optional, but encouraged. It provides an initial placement for the Brawl
              Pit to put to the test.
            </p>
            <ManualAddForm
              addState={addState}
              addBook={addBook}
              onSuccess={(newBook) => setBooks((prev) => [newBook, ...prev])}
            />
          </section>

          <hr className="my-2 h-px w-full text-button opacity-65 md:my-0" />

          {/* TABLE OF CURRENT BOOKS */}
          <section className="flex w-full flex-col gap-3 md:mt-1">
            <div className="flex w-full justify-between">
              <p // book count
                className={
                  'text-md h-fit w-fit rounded-md bg-button px-4 py-2 font-calistoga font-bold tracking-wide text-text shadow-2xl md:text-xl'
                }
              >
                {books.length} Book{books.length !== 1 && 's'}
              </p>
              <div className={`flex gap-2.5`}>
                <button
                  onClick={() => {
                    setOpenModal('csv')
                  }}
                  className={`mt-auto size-10 cursor-pointer rounded-full border-b-2 border-red-700/75 bg-button font-calistoga text-lg font-semibold tracking-wider text-text opacity-95 shadow-2xl transition-all hover:scale-104 hover:bg-button hover:opacity-100 active:scale-96 active:opacity-80 md:h-11 md:w-fit md:border-b-3 md:px-4.5 md:text-xl`}
                >
                  <CloudArrowUpIcon
                    weight={`duotone`}
                    className={'inline size-5.25 -translate-y-px md:mr-1.75'}
                  />
                  <span className={`hidden md:inline`}>CSV</span>
                </button>
                <button
                  onClick={() => {
                    setOpenModal('goodreads')
                  }}
                  className={`mt-auto size-10 cursor-pointer overflow-hidden rounded-full border-b-2 border-red-700/75 bg-button opacity-95 transition-all hover:scale-104 hover:bg-button hover:opacity-100 active:scale-96 active:opacity-80 md:size-11 md:border-b-3`}
                >
                  <img
                    src={goodreadsLogo}
                    alt="Goodreads"
                    className="block h-full w-full object-contain py-1.75"
                  />
                </button>
              </div>
            </div>

            {books.length > 0 && (
              <table className="w-full table-fixed border-collapse rounded-md bg-button text-text shadow-lg">
                <thead className={'text-left'}>
                  <tr className={'border-b-2 border-red-700 lg:border-b-3'}>
                    <th className={`w-[80%] lg:w-[50%] ${thStyle}`}>
                      <span>Title</span>
                    </th>
                    <th className={`w-[40%] max-lg:hidden ${thStyle}`}>Author</th>
                    <th className={`w-[20%] text-center lg:w-[10%] ${thStyle}`}>
                      <div
                        className={
                          'flex justify-end gap-3.5 pr-2.5 lg:justify-center lg:gap-6 lg:pr-0'
                        }
                      >
                        <FireSolid
                          className={`size-5 shrink-0 -translate-y-px self-end text-red-700 md:size-5.5 lg:size-6.25`}
                        />
                        <PencilSimpleLineIcon
                          weight={'fill'}
                          aria-label="Edit this book"
                          className="size-5 shrink-0 text-text/90 md:size-5.5 lg:size-6"
                        />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className={'text-base opacity-95 sm:text-lg'}>
                  {books.map((book) => (
                    <tr
                      key={book.id}
                      className={'border-b border-red-700/80 last:border-none lg:border-b-2'}
                    >
                      <td className={`pr-1 lg:pr-0 ${tdStyle}`}>
                        <span className={`line-clamp-2 font-bold text-pretty`}>{book.title}</span>
                        <span className="line-clamp-1 font-zain text-sm font-normal opacity-75 md:text-base lg:hidden">
                          {book.author}
                        </span>
                      </td>
                      <td className={`max-lg:hidden ${tdStyle}`}>
                        <span className={`line-clamp-3`}>{book.author}</span>
                      </td>
                      <td className={`pr-2.5 text-right lg:pr-0`}>
                        <div className={'flex justify-end gap-3.5 lg:justify-center lg:gap-6'}>
                          <button
                            onClick={() => setBookToBurn(book)}
                            title={'Delete book'}
                            className={`group cursor-pointer transition-all duration-200 hover:scale-120 hover:animate-pulse hover:brightness-120 active:scale-130 active:brightness-110`}
                          >
                            <FireOutline
                              aria-label="Delete this book"
                              className={`block size-5 text-red-700/95 group-hover:hidden group-active:hidden md:size-5.75 lg:size-6.25`}
                            />
                            <FireSolid
                              aria-label="Delete this book"
                              className={`hidden size-5.25 text-red-700 group-hover:block group-active:block md:size-5.75 lg:size-6.25`}
                            />
                          </button>
                          <button
                            onClick={() => setBookToEdit(book)}
                            title="Edit book details"
                            className={`group cursor-pointer transition-all duration-200 hover:scale-120 hover:animate-pulse hover:brightness-120 active:scale-130 active:brightness-110`}
                          >
                            <PencilSimpleLineIcon
                              weight={'duotone'}
                              aria-label="Edit this book"
                              className="block size-5 translate-y-px text-text/75 group-hover:hidden group-active:hidden md:size-5.5 lg:size-6"
                            />
                            <PencilSimpleLineIcon
                              weight={'fill'}
                              aria-label="Edit this book"
                              className="hidden size-5 translate-y-px text-text group-hover:block group-active:block md:size-5.5 lg:size-6"
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Reset button */}
            {books.length > 0 && (
              <button
                onClick={() => {
                  setOpenModal('reset')
                }}
                className={`ml-auto cursor-pointer rounded-lg border-b-3 border-red-700/90 bg-button/90 px-6 py-2.5 font-calistoga text-sm font-semibold tracking-wide text-text shadow-2xl transition-all hover:scale-104 hover:bg-button active:scale-96 active:opacity-100 md:bg-button/95 md:text-base md:font-extrabold md:tracking-wider`}
              >
                <BombIcon
                  weight={'fill'}
                  className={
                    'mr-1.75 inline size-3.75 -translate-y-px drop-shadow-2xl drop-shadow-zinc-950 md:size-4.5'
                  }
                />
                Factory Reset
              </button>
            )}
          </section>
        </>
      )}
    </main>
  )
}
