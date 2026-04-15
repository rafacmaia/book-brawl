import { useAuth } from '@clerk/react'
import { type ChangeEvent, type SubmitEvent, useEffect, useRef, useState } from 'react'
import { API_BASE, ApiError, apiFetch } from '../api.ts'
import Placeholder from '../components/Placeholder'
import PageHeading from '../components/PageHeading'
import { Ban, Download, SquareX } from 'lucide-react'
import { FireIcon as FireSolid } from '@heroicons/react/24/solid'
import { FireIcon as FireOutline } from '@heroicons/react/24/outline'

interface Book {
  id: number
  title: string
  author: string
}

interface ImportResult {
  imported: number
  skipped: number
  interrupted: boolean
}

function ImportModal({
  onClose,
  onImportSuccess,
}: {
  onClose: () => void
  onImportSuccess: (result: ImportResult) => void
}) {
  const { getToken } = useAuth()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const token = await getToken()
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API_BASE}/books/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json()
        setError(err.detail ?? 'Import failed')
        return
      }

      const data = await response.json()
      setResult(data)
      onImportSuccess(data)
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fieldStyling = 'font-bold underline decoration-red-600/90'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative flex w-xl flex-col gap-6 rounded-md border-4 border-background bg-button p-8 font-zain text-text shadow-2xl">
        <h2 className="font-calistoga text-3xl font-bold text-text">CSV Import</h2>
        <button
          onClick={onClose}
          className="absolute top-3 right-4 cursor-pointer font-extrabold text-red-700 hover:scale-112"
        >
          <SquareX size={28} />
        </button>
        <div className="flex flex-col gap-2 text-[20px] text-text/90">
          <p>
            Your CSV must have <span className={fieldStyling}>title</span> and{' '}
            <span className={fieldStyling}>author</span> columns.
          </p>
          <p>
            A <span className={fieldStyling}>rating</span> column (1–10, decimals welcome) is
            encouraged, but optional.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <label className="w-fit cursor-pointer rounded-md bg-text/90 px-6 py-3 text-[18px] font-bold text-primary shadow-md transition-all hover:scale-104 hover:bg-text">
            {loading ? 'Importing...' : 'Select CSV File'}
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={loading}
              className="hidden"
            />
          </label>
          {error && <p className="pl-1 text-[18px] font-bold text-red-700">{error}</p>}
          {result && (
            <div className="flex flex-col gap-2 pl-1 text-[20px] font-semibold tracking-wide">
              {result.skipped > 0 && (
                <p className="text-text">
                  Skipped{' '}
                  <span className="underline decoration-accent underline-offset-2">
                    {result.skipped}
                  </span>{' '}
                  {result.skipped === 1 ? 'book' : 'books'} already in the pit.
                </p>
              )}
              {result.imported > 0 ? (
                <p className="font-bold text-text">
                  ✔ Imported <span className="text-background">{result.imported}</span>{' '}
                  {result.imported === 1 ? 'book' : 'books'}!
                </p>
              ) : (
                <p className="text-red-700">❌ No books imported. Check file and try again.</p>
              )}
              {result.interrupted && (
                <p className="font-bold text-accent">
                  Book limit reached — not all books were imported.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DeleteModal({
  book,
  onConfirm,
  onCancel,
}: {
  book: Book
  onConfirm: () => void
  onCancel: () => void
}) {
  const buttonStyling =
    'cursor-pointer rounded-md border-b-4 md:border-b-3 border-background bg-red-800/80 md:w-3/10 w-1/3 px-4 pb-1 pt-2 md:py-2 font-zain text-[16px] md:text-[18px] font-extrabold tracking-wider text-primary drop-shadow-md transition-all hover:scale-104 hover:bg-red-800 active:scale-95 active:bg-red-800'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex w-[90%] flex-col items-center justify-center gap-4 rounded-lg border-6 border-red-800/80 bg-button p-6 font-zain text-text shadow-2xl md:w-xl md:gap-6 md:rounded-md md:border-4 md:p-8">
        <h2 className="font-calistoga text-3xl font-bold">Burn this book?</h2>
        <p className="text-center font-zain text-[20px] md:text-[22px]">
          <span className="font-calistoga text-[18px] font-bold md:text-[20px]">{book.title}</span>,
          by{' '}
          <span className={'font-calistoga text-[18px] font-semibold md:text-[20px]'}>
            {book.author}
          </span>
          , will be permanently removed from the Book Pit.
        </p>
        <div className="flex w-full items-center justify-center gap-10 md:gap-12">
          <button onClick={onConfirm} className={buttonStyling}>
            BURN
          </button>
          <button onClick={onCancel} className={buttonStyling}>
            KEEP
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ManagePit() {
  const { getToken } = useAuth()

  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [loadingAdd, setLoadingAdd] = useState<boolean>(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [newBook, setNewBook] = useState<Book | null>(null)

  const [bookToBurn, setBookToBurn] = useState<Book | null>(null)
  const [showImportModal, setShowImportModal] = useState<boolean>(false)

  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void fetchBooks()
  }, [])

  async function fetchBooks() {
    setLoading(true)
    setError(null)

    try {
      const token = await getToken()

      const response = await apiFetch('/books', token!)

      const data = await response.json()
      setBooks(data)
    } catch {
      setError('Failed to load books. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const title = formData.get('title') as string
    const author = formData.get('author') as string
    const rating = formData.get('rating') as string | null

    if (!title.trim() || !author.trim()) {
      setNewBook(null)
      setAddError('Please enter both title and author.')
      return
    }

    const parsedRating = rating ? parseFloat(rating) : null
    if (parsedRating !== null && (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 10)) {
      setNewBook(null)
      setAddError('Rating must be between 1 and 10')
      return
    }

    setLoadingAdd(true)
    setAddError(null)
    setNewBook(null)

    try {
      const token = await getToken()

      const response = await apiFetch('/books', token!, {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim(),
          rating: parsedRating,
        }),
      })

      const newBook = await response.json()

      setBooks((prev) => [newBook, ...prev])
      setNewBook(newBook)
      form.reset()
      titleRef.current?.focus()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setAddError('This book is already in the pit!')
      } else {
        setAddError(`Something went wrong. Please try again. ${err}`)
      }
    } finally {
      setLoadingAdd(false)
    }
  }

  function handleImportSuccess() {
    setNewBook(null)
    setAddError(null)

    void fetchBooks()
  }

  async function handleBurn(book: Book) {
    setNewBook(null)
    setAddError(null)

    try {
      const token = await getToken()

      await apiFetch(`/books/${book.id}`, token!, { method: 'DELETE' })

      setBooks((prev) => prev.filter((b) => b.id !== book.id))
    } catch {
      setError('Failed to burn book. Please try again.')
    } finally {
      setBookToBurn(null)
    }
  }

  const cellXPadding = 'px-1 first:pl-2 md:px-2 md:first:pl-4'
  const thStyling = `font-calistoga text-[16px] md:text-[20px] tracking-wide pt-1 md:pt-2 pb-1 font-extrabold ${cellXPadding}`
  const tdStyling = `py-1 md:py-1.5 ${cellXPadding}`
  const addMessageStyling = `w-full md:self-end rounded-md md:rounded-lg bg-button px-4 py-2 text-base md:w-fit md:px-6 md:text-xl md:brightness-110`

  const addTriggered = newBook != null || addError != null || loadingAdd

  return (
    <main className="mx-auto flex h-full min-h-0 w-[98%] grow flex-col items-center gap-3 overflow-y-auto p-2 text-primary/95 sm:w-2/3 sm:gap-4 sm:p-4">
      <PageHeading title={'Manage the Pit'} />

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImportSuccess={handleImportSuccess}
        />
      )}

      {bookToBurn && (
        <DeleteModal
          book={bookToBurn}
          onConfirm={() => handleBurn(bookToBurn)}
          onCancel={() => setBookToBurn(null)}
        />
      )}

      {error ? (
        <Placeholder message={error} />
      ) : loading ? (
        <Placeholder message="Loading books..." />
      ) : (
        <>
          {/* MANUAL INPUT */}
          <section
            className={`mt-6 w-full sm:mt-12 ${addTriggered ? 'mb-0' : 'mb-12 md:mb-15'} flex flex-col gap-4`}
          >
            <h2 className="font-calistoga text-2xl font-bold tracking-wide decoration-accent/80 decoration-wavy underline-offset-8 drop-shadow-md sm:mb-4 sm:text-3xl sm:underline">
              New Entries
            </h2>
            <p className={`text-[16px] font-medium sm:text-[20px]/8 sm:tracking-wide`}>
              <span className={`font-extrabold decoration-accent/80`}>Rating</span> (1-10) is
              optional, but encouraged. It gives the book an initial placement, which over time, the
              Brawl Pit will confirm or disprove.
            </p>
            <form
              className="flex w-full flex-col justify-between gap-3 font-calistoga text-base font-bold text-text sm:gap-0 sm:text-lg md:flex-row"
              onSubmit={(e) => handleAdd(e)}
            >
              <input
                aria-label="Enter book title"
                type="text"
                placeholder="Title"
                name="title"
                ref={titleRef}
                className="rounded-md border-b-3 border-primary/85 bg-blue-200/90 p-2 pl-3 shadow-lg sm:w-[48%]"
              />
              <input
                aria-label="Enter book author"
                type="text"
                placeholder="Author"
                name="author"
                className="rounded-md border-b-3 border-primary/85 bg-blue-200/90 p-2 pl-3 shadow-lg sm:w-[30%]"
              />
              <input
                aria-label="Enter optional rating (1-10, decimals welcome)"
                type="number"
                min="1"
                max="10"
                step="0.1"
                placeholder="Rating"
                name="rating"
                className="rounded-md border-b-3 border-primary/85 bg-blue-200/90 p-2 pl-3 shadow-lg sm:w-[11%]"
              />
              <button
                type="submit"
                title={'Add new book'}
                className="cursor-pointer rounded-md border-b-3 border-primary/75 bg-accent/80 p-2 text-center font-gaegu text-xl font-black text-primary shadow-md transition-all hover:bg-accent/90 active:scale-97 active:bg-accent/70 sm:w-[8%] sm:p-1 sm:text-2xl md:bg-accent/75"
              >
                <span className="inline md:hidden">Add Book</span>
                <span className="hidden md:inline">Add</span>
              </button>
            </form>
            {addError && (
              <p
                className={`font-extrabold text-red-700 opacity-96 md:text-red-800 md:opacity-90 ${addMessageStyling}`}
              >
                <Ban
                  strokeWidth={3}
                  className={'mr-2 inline size-4 -translate-y-0.5 md:size-4.25'}
                />
                {addError}
              </p>
            )}

            {newBook && (
              <p className={`text-text ${addMessageStyling}`}>
                ✔ Added:{' '}
                <span
                  className={
                    'font-bold decoration-accent/70 underline-offset-3 md:ml-1 md:underline'
                  }
                >
                  {newBook.title}
                </span>
                , by{' '}
                <span className={'font-bold decoration-accent/70 underline-offset-3 md:underline'}>
                  {newBook.author}
                </span>
              </p>
            )}

            {loadingAdd && (
              <p className={`font-bold text-text opacity-80 ${addMessageStyling}`}>
                Updating the pit...
              </p>
            )}
          </section>

          <hr className="my-2 h-px w-full text-button md:my-0" />

          {/* TABLE OF CURRENT BOOKS */}
          <section className="flex w-full flex-col gap-4">
            <div className="flex w-full justify-between">
              <p
                className={
                  'h-fit w-fit rounded-md bg-button px-4 py-2 font-calistoga text-[16px] font-semibold tracking-wide text-text shadow-2xl md:px-6 md:text-[20px] md:font-bold md:tracking-wider'
                }
              >
                Books in the Pit: {books.length}
              </p>
              <button
                onClick={() => {
                  setShowImportModal(true)
                }}
                className={`cursor-pointer rounded-full border-b-3 border-accent/80 bg-button px-4 py-2 font-calistoga text-[14px] font-semibold tracking-wide text-text shadow-2xl transition-all hover:scale-104 hover:bg-button active:scale-96 active:opacity-90 md:bg-button/95 md:px-6 md:text-base md:font-extrabold md:tracking-wider`}
              >
                {/*<span className={'mr-2 drop-shadow-2xl drop-shadow-zinc-950'}>📥</span> */}
                <Download
                  strokeWidth={3}
                  className={
                    'mr-2 inline size-4 -translate-y-px drop-shadow-2xl drop-shadow-zinc-950 md:size-4.5'
                  }
                />
                CSV Import
              </button>
            </div>

            {books.length > 0 && (
              <table className="w-full table-fixed border-collapse rounded-md bg-button text-text shadow-lg">
                <thead className={'text-left'}>
                  <tr className={'border-b-2 border-red-700 md:border-b-3'}>
                    <th className={`w-[45%] md:w-[50%] ${thStyling}`}>Title</th>
                    <th className={`w-[40%] md:w-[40%] ${thStyling}`}>Author</th>
                    <th className={`w-[15%] text-center md:w-[10%] ${thStyling}`}>Burn?</th>
                  </tr>
                </thead>
                <tbody className={'text-[16px] opacity-95 md:text-[18px]'}>
                  {books.map((book) => (
                    <tr
                      key={book.id}
                      className={'border-b border-red-700/80 last:border-none md:border-b-2'}
                    >
                      <td className={`font-bold ${tdStyling}`}>{book.title}</td>
                      <td className={tdStyling}>{book.author}</td>
                      <td className={`text-center`}>
                        <button
                          onClick={() => setBookToBurn(book)}
                          title={'Delete book'}
                          className={`group cursor-pointer transition-all hover:scale-115 hover:animate-pulse hover:brightness-120 active:scale-115`}
                        >
                          <FireOutline
                            className={`block size-5 translate-y-1 text-red-700 group-hover:hidden group-active:hidden md:size-7`}
                          />
                          <FireSolid
                            className={`hidden size-5 translate-y-1 text-red-700 group-hover:block group-active:block md:size-7`}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </main>
  )
}
