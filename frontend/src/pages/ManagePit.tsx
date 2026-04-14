import { useAuth } from '@clerk/react'
import { type ChangeEvent, type SubmitEvent, useEffect, useRef, useState } from 'react'
import { API_BASE, ApiError, apiFetch } from '../api.ts'
import Placeholder from '../components/Placeholder'
import PageHeading from '../components/PageHeading'

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative flex w-xl flex-col gap-6 rounded-md border-4 border-background bg-button p-8 font-zain text-text shadow-2xl">
        <h2 className="font-calistoga text-3xl font-bold text-text">CSV Import</h2>
        <button
          onClick={onClose}
          className="absolute top-3 right-4 cursor-pointer text-[18px] font-extrabold text-red-700 hover:scale-112"
        >
          🔴
        </button>
        <div className="flex flex-col gap-2 text-[20px] text-text/90">
          <p>
            Your CSV must have{' '}
            <span className="font-bold underline decoration-accent/75">title</span> and{' '}
            <span className="font-bold underline decoration-accent/75">author</span> columns.
          </p>
          <p>
            A <span className="font-bold underline decoration-accent/75">rating</span> column (1–10,
            decimals welcome) is encouraged, but optional.
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
          {error && <p className="text-[18px] font-bold text-accent">{error}</p>}
          {result && (
            <div className="flex flex-col gap-2 text-[20px] font-semibold tracking-wide">
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
    'cursor-pointer  rounded-md border-b-3 border-background bg-red-800/80 w-3/10 px-4 py-2 font-zain text-[18px] font-extrabold tracking-wider text-primary drop-shadow-md transition-all hover:scale-104 hover:bg-red-800'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex w-xl flex-col items-center justify-center gap-6 rounded-md border-4 border-background bg-button p-8 font-zain text-text shadow-2xl">
        <h2 className="font-calistoga text-3xl font-bold">Burn this book?</h2>
        <p className="text-center font-zain text-[22px]">
          <span className="font-calistoga text-[20px] font-bold">{book.title}</span>, by{' '}
          <span className={'font-calistoga text-[20px] font-semibold'}>{book.author}</span>, will be
          permanently removed from the Book Pit.
        </p>
        <div className="flex w-full items-center justify-center gap-12">
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
      setAddError('Please enter both title and author.')
      return
    }

    const parsedRating = rating ? parseFloat(rating) : null
    if (parsedRating !== null && (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 10)) {
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

  const cellXPadding = 'px-2 first:pl-4 last:pr-4'
  const thStyling = `font-calistoga text-[20px] tracking-wide pt-2 pb-1 font-extrabold ${cellXPadding}`
  const tdStyling = `py-1.5 ${cellXPadding}`

  return (
    <main className="mx-auto flex h-full min-h-0 w-2/3 grow flex-col items-center justify-center gap-8 overflow-y-auto p-4 text-primary/95">
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
          <section className="mt-4 flex w-full flex-col gap-4">
            <h2 className="mb-4 font-calistoga text-3xl font-bold tracking-wide underline decoration-accent/80 decoration-wavy underline-offset-8 drop-shadow-md">
              New Entries
            </h2>
            <p className={`text-lg text-[20px] font-medium tracking-wide`}>
              <span className={`font-extrabold decoration-accent/80`}>Rating</span> (1-10, decimals
              welcome) is optional, but encouraged. It sets an initial placement for the book, which
              over time, the Brawl Pit will confirm or disprove.
            </p>
            <form
              className="flex w-full justify-between font-calistoga text-lg font-bold text-text"
              onSubmit={(e) => handleAdd(e)}
            >
              <input
                aria-label="Enter book title"
                type="text"
                placeholder="Title"
                name="title"
                ref={titleRef}
                className="w-[48%] rounded-md border-b-3 border-primary/85 bg-blue-200/90 p-2 pl-3 shadow-lg"
              />
              <input
                aria-label="Enter book author"
                type="text"
                placeholder="Author"
                name="author"
                className="w-[30%] rounded-md border-b-3 border-primary/85 bg-blue-200/90 p-2 pl-3 shadow-lg"
              />
              <input
                aria-label="Enter optional rating (1-10, decimals welcome)"
                type="number"
                min="1"
                max="10"
                step="0.1"
                placeholder="Rating"
                name="rating"
                className="border-accent/ w-[11%] rounded-md border-b-3 border-primary/85 bg-blue-200/90 p-2 pl-3 shadow-lg"
              />
              <button
                type="submit"
                className="w-[8%] cursor-pointer rounded-md border-b-3 border-primary/75 bg-accent/75 p-1 text-center font-gaegu text-2xl font-black text-primary shadow-md transition-all hover:bg-accent/90"
              >
                Add
              </button>
            </form>
            {addError && (
              <p className="w-fit self-end rounded-lg bg-button/90 px-6 py-2 text-xl font-bold text-red-800 brightness-110">
                <span className={'mr-2'}>❌</span>
                {addError}
              </p>
            )}

            {newBook && (
              <p
                className={
                  'self-end rounded-lg bg-button px-6 py-2 text-xl text-text brightness-110'
                }
              >
                ✔ Added:{' '}
                <span
                  className={'ml-1 font-bold underline decoration-accent/70 underline-offset-3'}
                >
                  {newBook.title}
                </span>
                , by{' '}
                <span className={'font-bold underline decoration-accent/70 underline-offset-3'}>
                  {newBook.author}
                </span>
              </p>
            )}

            {loadingAdd && (
              <p
                className={
                  'self-end rounded-lg bg-button/80 px-6 py-2 text-xl font-bold text-text brightness-110'
                }
              >
                Updating the pit...
              </p>
            )}
          </section>

          {/*<hr className="h-px w-full bg-button" />*/}

          {/* TABLE OF CURRENT BOOKS */}
          <section className="mt-4 flex w-full flex-col gap-4">
            <div className="flex w-full justify-between">
              <p
                className={
                  'h-fit w-fit rounded-md bg-button px-6 py-2 font-calistoga text-[20px] font-bold tracking-wider text-text shadow-2xl'
                }
              >
                Books in the Pit: {books.length}
              </p>
              <button
                onClick={() => {
                  setShowImportModal(true)
                }}
                className={`hover:shadow-3xl cursor-pointer rounded-full border-b-3 border-accent/80 bg-button/95 px-6 py-2 font-calistoga text-base font-extrabold tracking-wider text-text shadow-2xl transition-all hover:scale-104 hover:bg-button`}
              >
                <span className={'mr-2 drop-shadow-2xl drop-shadow-zinc-950'}>📥</span> CSV Import
              </button>
            </div>

            <table className="w-full table-fixed border-collapse rounded-md bg-button text-text shadow-lg">
              <thead className={'text-left'}>
                <tr className={'border-b-3 border-red-700'}>
                  <th className={`w-5/10 ${thStyling}`}>Title</th>
                  <th className={`w-4/10 ${thStyling}`}>Author</th>
                  <th className={`w-1/10 text-center ${thStyling}`}>Burn?</th>
                </tr>
              </thead>
              <tbody className={'text-[18px] opacity-95'}>
                {books.map((book) => (
                  <tr key={book.id} className={'border-b-2 border-red-700/80 last:border-none'}>
                    <td className={`font-bold ${tdStyling}`}>{book.title}</td>
                    <td className={tdStyling}>{book.author}</td>
                    <td className={`text-center ${tdStyling}`}>
                      <button
                        onClick={() => setBookToBurn(book)}
                        title={'Delete book'}
                        className={`cursor-pointer transition-all hover:scale-112 hover:brightness-120`}
                      >
                        <span className={`drop-shadow-2xl drop-shadow-amber-950`}>🔥</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  )
}
