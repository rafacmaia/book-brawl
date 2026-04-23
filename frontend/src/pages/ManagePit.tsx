import { useAuth } from '@clerk/react'
import {
  type ChangeEvent,
  type KeyboardEvent,
  type SubmitEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import { API_BASE, ApiError, apiFetch } from '../api.ts'
import Placeholder from '../components/Placeholder'
import PageHeading from '../components/PageHeading'
import { Ban, Download } from 'lucide-react'
import { FireIcon as FireSolid } from '@heroicons/react/24/solid'
import { FireIcon as FireOutline } from '@heroicons/react/24/outline'
import {
  BombIcon,
  CheckCircleIcon,
  PencilSimpleLineIcon,
  ProhibitInsetIcon,
  SkipForwardCircleIcon,
  XCircleIcon,
} from '@phosphor-icons/react'

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

// ====== MODAL SUBCOMPONENTS

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
      <div className="relative flex w-[90%] flex-col gap-4 rounded-lg border border-t-6 border-b-6 border-background bg-button/97 px-7 py-5 font-zain text-text shadow-2xl md:w-lg md:gap-6 md:rounded-md md:border-t-8 md:border-b-8 md:p-8">
        <h2 className="font-calistoga text-[28px] font-bold text-text md:text-[30px]">
          Import from a CSV
        </h2>
        <div className="flex flex-col gap-2 rounded-md bg-background/95 px-3 py-2 text-[18px] tracking-wide text-primary md:px-4 md:py-3 md:text-[20px]">
          <p>
            Your CSV file must have <span className={fieldStyling}>title</span> and{' '}
            <span className={fieldStyling}>author</span> columns.
          </p>
          <p>
            A <span className={fieldStyling}>rating</span> column (1–10, decimals welcome) is
            encouraged, but optional.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 md:gap-6">
            <label
              className={`flex-3 cursor-pointer rounded-t-md rounded-b-2xl border-b-4 border-red-600/80 bg-text/95 px-6 pt-3 pb-2.5 text-center text-[18px] font-extrabold tracking-wide text-primary/95 shadow-md transition-all hover:scale-104 hover:bg-text hover:opacity-100 md:flex-2 md:py-1.5 md:pt-2.5 ${result ? 'opacity-85' : 'opacity-95'}`}
            >
              {loading ? 'Importing...' : 'Select File'}
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={loading}
                className="sr-only"
              />
            </label>
            <button
              onClick={onClose}
              aria-label="Close CSV import modal"
              className={`flex-2 cursor-pointer rounded-t-md rounded-b-2xl border-b-4 border-red-800 bg-background px-4 pt-3 pb-2.5 font-zain text-[16px] font-extrabold tracking-wider text-primary/90 drop-shadow-md transition-all hover:scale-104 hover:bg-background hover:opacity-100 active:scale-95 active:bg-background md:py-1.5 md:pt-2.5 md:text-[18px] ${result ? 'opacity-95' : 'opacity-80'}`}
            >
              {result ? 'CLOSE' : 'CANCEL'}
            </button>
          </div>
          {error && <p className="mt-1 pl-1 text-[18px] font-bold text-red-700">{error}</p>}
          {result && (
            <div className="mt-1 flex flex-col gap-2 pl-1 text-[18px] font-semibold tracking-wide">
              {result.skipped > 0 && (
                <p className="text-text">
                  <SkipForwardCircleIcon
                    weight={'fill'}
                    aria-label="Edit this book"
                    className="text-text80 inline size-5 -translate-y-0.5 md:size-5.75"
                  />{' '}
                  Skipped{' '}
                  <span className="underline decoration-red-700/90 underline-offset-2">
                    {result.skipped}
                  </span>{' '}
                  {result.skipped === 1 ? 'book' : 'books'} already present.
                </p>
              )}
              {result.imported > 0 ? (
                <p className="font-bold text-text">
                  <CheckCircleIcon
                    weight={'fill'}
                    aria-label="Edit this book"
                    className="inline size-5 -translate-y-0.5 opacity-90 md:size-5.75"
                  />{' '}
                  Imported{' '}
                  <span className="underline decoration-accent underline-offset-2">
                    {result.imported}
                  </span>{' '}
                  {result.imported === 1 ? 'book' : 'books'}!
                </p>
              ) : (
                <p className="text-red-700/95">
                  <XCircleIcon
                    weight={'fill'}
                    aria-label="Edit this book"
                    className="inline size-5 -translate-y-0.5 opacity-90 md:size-5.75"
                  />{' '}
                  No books imported. Check file and try again.
                </p>
              )}
              {result.interrupted && (
                <p className="font-bold text-red-700/95">
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
    'cursor-pointer rounded-t-md rounded-b-2xl border-b-4 md:border-b-3 w-3/8 pb-1.5 pt-2.75 md:py-1.5 md:pt-2.5 font-zain text-[16px] md:text-[18px] font-extrabold tracking-wider text-primary drop-shadow-md transition-all hover:scale-104 active:scale-95'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex w-[90%] flex-col items-center justify-center gap-5 rounded-lg border border-t-6 border-b-6 border-red-800/80 bg-button/97 px-8 py-6 font-zain text-text shadow-2xl md:w-xl md:gap-7 md:rounded-md md:border-t-8 md:border-b-8 md:px-10 md:py-8">
        <h2 className="font-calistoga text-3xl font-bold">Burn this book?</h2>
        <p className="text-left font-zain text-[20px] text-text/95 md:text-[22px]">
          <span className="font-calistoga text-[18px] font-bold tracking-wide md:text-[20px]">
            {book.title}
          </span>
          , by{' '}
          <span className={'font-calistoga text-[18px] font-semibold tracking-wide md:text-[20px]'}>
            {book.author}
          </span>
          , will be permanently removed from the Book Pit.
        </p>
        <div className="flex w-full items-center justify-center gap-8 md:gap-12">
          <button
            onClick={onConfirm}
            className={`border-background bg-red-800/75 hover:bg-red-800 active:bg-red-800 ${buttonStyling}`}
          >
            <FireSolid className="inline size-5.25 -translate-y-0.5 sm:-translate-y-0.5" />
          </button>
          <button
            onClick={onCancel}
            className={`border-red-800 bg-background/90 opacity-95 hover:bg-background active:bg-background ${buttonStyling}`}
          >
            KEEP
          </button>
        </div>
      </div>
    </div>
  )
}

function EditModal({
  book,
  onConfirm,
  onCancel,
  error,
}: {
  book: Book
  onConfirm: (title: string, author: string) => void
  onCancel: () => void
  error: string | null
}) {
  const [title, setTitle] = useState(book.title)
  const [author, setAuthor] = useState(book.author)

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      onConfirm(title, author)
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  const unchangedTitle = title === book.title
  const unchangedAuthor = author === book.author

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="items-left relative flex w-[90%] flex-col justify-center gap-8 rounded-lg border border-t-6 border-b-6 border-red-800/80 bg-button/97 px-8 py-6 font-zain text-text shadow-2xl md:w-xl md:gap-8 md:rounded-md md:border-t-8 md:border-b-8 md:p-8">
        <h2 className="font-calistoga text-3xl font-bold">Edit Book</h2>
        <button
          onClick={onCancel}
          aria-label="Close edit modal"
          className="absolute top-2 right-2 cursor-pointer text-red-800/80 transition-all hover:scale-112 active:scale-95 md:top-3 md:right-3"
        >
          <XCircleIcon weight={'duotone'} className="size-6.25 md:size-7" />
        </button>
        <div className="flex flex-col gap-3 font-zain text-[16px] md:gap-4 md:text-[18px]">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`w-full rounded-md border-b-3 border-red-800/85 bg-blue-300/50 px-3 py-2 font-calistoga placeholder-text/50 shadow-lg sm:p-2 ${unchangedTitle ? 'text-text/70' : 'text-text'}`}
          />
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`w-full rounded-md border-b-3 border-red-800/85 bg-blue-300/50 px-3 py-2 font-calistoga shadow-lg sm:p-2 ${unchangedAuthor ? 'text-text/70' : 'text-text'}`}
          />
          <button
            onClick={() => onConfirm(title, author)}
            className={`mt-3 cursor-pointer self-center rounded-t-md rounded-b-2xl border-b-4 border-red-800/85 bg-background/90 px-12 pt-2.5 pb-1.25 font-zain text-[16px] font-extrabold tracking-widest text-primary drop-shadow-md transition-all hover:scale-104 hover:border-background/90 hover:bg-red-800 active:scale-95 active:bg-red-800 md:px-16 md:py-1.5 md:pt-2.5 md:text-[18px]`}
          >
            SAVE
          </button>
          {error && (
            <p
              className={`w-full self-center rounded-md bg-red-800/85 px-3 py-2 text-left text-base font-extrabold text-primary opacity-95 md:rounded-lg md:px-4 md:pt-2.5 md:text-lg md:text-primary md:opacity-90 md:brightness-110`}
            >
              <Ban
                strokeWidth={3}
                className={'mr-2 inline size-4 -translate-y-px sm:-translate-y-0.5 md:size-4.25'}
              />
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function ResetModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const [finalConfirmation, setFinalConfirmation] = useState(false)
  const [resetTimer, setResetTimer] = useState(3)

  useEffect(() => {
    if (!finalConfirmation || resetTimer === 0) return

    const interval = setInterval(() => {
      setResetTimer((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [finalConfirmation, resetTimer])

  const buttonStyling =
    'rounded-t-md rounded-b-2xl border-b-4 md:border-b-3 px-4 pb-1.25 pt-2.5 md:py-2 md:pt-3 md:pb-1.75 font-zain text-[16px] md:text-[18px] font-extrabold tracking-wider text-primary drop-shadow-md transition-all'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex w-[90%] flex-col items-center justify-center gap-5 rounded-lg border border-t-6 border-b-6 border-red-800/80 bg-button/97 p-6 font-zain text-text shadow-2xl md:w-xl md:rounded-md md:border-t-8 md:border-b-8 md:p-8">
        <h2 className="font-calistoga text-3xl font-bold tracking-wide md:mb-2 md:text-[32px]">
          Burn it all?
        </h2>
        <p className="rounded-md bg-background/90 px-3 py-2 text-left font-zain text-[18px] tracking-wide text-primary md:px-4 md:py-3 md:text-[20px]">
          This will{' '}
          <span className={'font-extrabold underline decoration-primary/70 underline-offset-2'}>
            permanently
          </span>{' '}
          delete all books and trigger a complete Pit reset.
        </p>
        <div className="flex w-full items-center justify-center gap-6">
          <button
            onClick={() => setFinalConfirmation(true)}
            disabled={finalConfirmation}
            aria-label="Delete all books and reset the pit"
            className={`w-1/3 flex-2 border-background bg-red-800/75 md:w-3/10 ${buttonStyling} ${finalConfirmation ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-104 hover:bg-red-800 active:scale-95 active:bg-red-800'}`}
          >
            RESET
          </button>
          <button
            onClick={onCancel}
            aria-label="Close reset modal and cancel reset"
            className={`w-1/3 flex-3 cursor-pointer border-red-800 bg-background hover:scale-104 hover:bg-background hover:opacity-100 active:scale-95 active:bg-background active:opacity-90 md:w-3/10 ${buttonStyling} ${finalConfirmation ? 'opacity-85' : 'opacity-75'}`}
          >
            CANCEL
          </button>
        </div>
        {finalConfirmation && (
          <div className="flex w-full flex-col items-center justify-center gap-5">
            <p className="rounded-md bg-red-800/85 px-3 py-2 font-zain text-[18px] font-extrabold tracking-wide text-primary/95 md:px-4 md:py-3 md:text-[20px]">
              Last warning: this cannot be undone. All data will be lost. Do you wish to continue?
            </p>
            <button
              onClick={onConfirm}
              aria-label="Confirm reset"
              disabled={resetTimer > 0}
              className={`w-full border-background bg-red-800/85 pt-2.75 pb-1.5 hover:bg-red-800 active:bg-red-800 ${resetTimer === 0 ? 'cursor-pointer hover:scale-104 active:scale-95' : 'cursor-not-allowed'} ${buttonStyling}`}
            >
              {resetTimer > 0 ? (
                `Wait... ${resetTimer}`
              ) : (
                <BombIcon
                  weight={'fill'}
                  className={`inline size-4.75 -translate-y-0.5 sm:-translate-y-0.5`}
                />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ====== MAIN PAGE

export default function ManagePit() {
  const { getToken } = useAuth()

  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [loadingAdd, setLoadingAdd] = useState<boolean>(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [newBook, setNewBook] = useState<Book | null>(null)

  const [editError, setEditError] = useState<string | null>(null)

  const [bookToBurn, setBookToBurn] = useState<Book | null>(null)
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null)
  const [showImportModal, setShowImportModal] = useState<boolean>(false)
  const [showResetModal, setShowResetModal] = useState<boolean>(false)

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
        form.reset()
        setAddError(`${title}, by ${author}, is already in the pit!`)
      } else {
        setAddError(`Something went wrong. Please try again.`)
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

  async function handleEdit(title: string, author: string) {
    setNewBook(null)
    setAddError(null)

    if (!bookToEdit) return

    title = title.trim()
    author = author.trim()

    if (title === bookToEdit.title && author === bookToEdit.author) {
      setBookToEdit(null)
      return
    }

    try {
      const token = await getToken()

      await apiFetch(`/books/${bookToEdit.id}`, token!, {
        method: 'PATCH',
        body: JSON.stringify({ title, author }),
      })

      setBooks((prev) =>
        prev.map((b) => (b.id === bookToEdit.id ? { ...b, title: title, author: author } : b))
      )
      setBookToEdit(null)
      setEditError(null)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setEditError(`${title}, by ${author}, is already in the pit!`)
      } else {
        setEditError(`Something went wrong. Please try again.`)
      }
    }
  }

  async function handleReset() {
    setNewBook(null)
    setAddError(null)

    try {
      const token = await getToken()

      await apiFetch('/books', token!, { method: 'DELETE' })

      setBooks([])
    } catch {
      setError('Failed to reset pit. Please try again.')
    } finally {
      setShowResetModal(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.requestSubmit()
    }
  }

  const cellXPadding = 'first:pl-2.25 lg:px-2 lg:first:pl-4'
  const thStyling = `font-calistoga text-[16px] md:text-[18px] lg:text-[20px] tracking-wider pt-1.5 lg:pt-2 lg:pb-1.5 pb-1.25 font-extrabold ${cellXPadding}`
  const tdStyling = `py-1.25 lg:py-1.75 ${cellXPadding}`

  const inputStyling = 'rounded-md border-b-3 border-primary/85 bg-blue-200 p-3 sm:p-2 shadow-lg'

  const addMessageStyling = `w-full md:self-end rounded-md md:rounded-lg bg-button px-4 pb-1.75 pt-2.25 text-[18px] md:w-fit md:px-6 md:text-[20px] md:brightness-110`

  const addTriggered = newBook != null || addError != null || loadingAdd

  return (
    <main className="mx-auto flex h-full min-h-0 w-[97%] grow flex-col items-center gap-4 overflow-y-auto p-2 text-primary/95 sm:max-w-6xl sm:gap-4 md:p-4">
      <div className={'mb-5 max-md:hidden'}>
        <PageHeading title={'Manage the Pit'} />
      </div>

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImportSuccess={handleImportSuccess}
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
          onCancel={() => setBookToBurn(null)}
        />
      )}

      {showResetModal && (
        <ResetModal onConfirm={handleReset} onCancel={() => setShowResetModal(false)} />
      )}

      {error ? (
        <Placeholder message={error} />
      ) : loading ? (
        <Placeholder message="Loading books..." />
      ) : (
        <>
          {/* MANUAL INPUT */}
          <section
            className={`mt-1.5 flex w-full flex-col gap-4 md:mt-2 ${addTriggered ? 'mb-0' : 'md:mb-15.5'}`}
          >
            <h2 className="font-calistoga text-[28px] font-bold tracking-wide drop-shadow-md sm:mb-2 sm:text-3xl">
              New Reads
            </h2>
            <p
              className={`rounded-md bg-button/95 px-3 py-2 text-[16px] font-medium text-pretty text-text/90 sm:text-[18px]/8 sm:tracking-wide sm:text-text`}
            >
              <span className={`font-extrabold decoration-accent/80`}>Rating</span> (1-10, decimals
              welcome) is optional, but encouraged. It provides an initial placement for the Brawl
              Pit to put to the test.
            </p>
            <form
              className="flex w-full flex-col justify-between gap-3 font-calistoga text-base font-bold text-text sm:text-lg md:flex-row md:gap-0"
              onKeyDown={handleKeyDown}
              onSubmit={handleAdd}
            >
              <input
                aria-label="Enter book title"
                type="text"
                placeholder="Title"
                name="title"
                ref={titleRef}
                className={`md:w-[48%] ${inputStyling}`}
              />
              <input
                aria-label="Enter book author"
                type="text"
                placeholder="Author"
                name="author"
                className={`md:w-[30%] ${inputStyling}`}
              />
              <input
                aria-label="Enter optional rating (1-10, decimals welcome)"
                type="number"
                min="1"
                max="10"
                step="0.1"
                placeholder="Rating"
                name="rating"
                className={`md:w-[11%] ${inputStyling}`}
              />
              <button
                type="submit"
                title={'Add new book'}
                className="cursor-pointer rounded-md border-b-3 border-primary/75 bg-accent/80 pt-2.5 pb-1.5 text-center font-zain text-[20px] font-extrabold text-primary/90 shadow-md transition-all hover:scale-102 hover:bg-accent/85 active:scale-97 active:bg-accent/70 md:w-[8%] md:bg-accent/75 md:pt-1.75 md:pb-0.75 md:text-[22px]"
              >
                <span className="inline md:hidden">Add Book</span>
                <span className="hidden md:inline">Add</span>
              </button>
            </form>
            {addError && (
              <p
                className={`font-extrabold text-red-800 opacity-96 md:opacity-90 ${addMessageStyling}`}
              >
                <ProhibitInsetIcon
                  weight={'duotone'}
                  className={'mr-1.5 inline size-5 -translate-y-0.5 md:size-5.25'}
                />
                {addError}
              </p>
            )}

            {newBook && (
              <p className={`text-text ${addMessageStyling}`}>
                <CheckCircleIcon
                  weight={'duotone'}
                  className={
                    'mr-1.5 inline size-5 -translate-y-0.5 md:size-5.25 md:-translate-y-0.75'
                  }
                />
                Added:{' '}
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

          <hr className="my-2 h-px w-full text-button opacity-65 md:my-0" />

          {/* TABLE OF CURRENT BOOKS */}
          <section className="flex w-full flex-col gap-3 md:mt-1">
            <div className="flex w-full justify-between">
              <p
                className={
                  'h-fit w-fit rounded-md bg-button px-4 py-2 font-calistoga text-[16px] font-semibold tracking-wide text-text shadow-2xl md:px-6 md:text-[20px] md:font-bold md:tracking-wider'
                }
              >
                {books.length} Book{books.length !== 1 && 's'}
              </p>
              <button
                onClick={() => {
                  setShowImportModal(true)
                }}
                className={`cursor-pointer rounded-full border-b-3 border-red-700/75 bg-button/95 px-4 py-2 font-calistoga text-[14px] font-semibold tracking-wide text-text shadow-2xl transition-all hover:scale-104 hover:bg-button active:scale-96 active:opacity-90 md:bg-button/95 md:px-6 md:text-[18px] md:font-extrabold md:tracking-wider`}
              >
                <Download
                  strokeWidth={3}
                  className={
                    'mr-1.5 inline size-3.5 -translate-y-px drop-shadow-2xl drop-shadow-zinc-950 md:mr-1.75 md:size-4.25'
                  }
                />
                CSV
              </button>
            </div>

            {books.length > 0 && (
              <table className="w-full table-fixed border-collapse rounded-md bg-button text-text shadow-lg">
                <thead className={'text-left'}>
                  <tr className={'border-b-2 border-red-700 lg:border-b-3'}>
                    <th className={`w-[80%] lg:w-[50%] ${thStyling}`}>
                      <span>Title</span>
                    </th>
                    <th className={`w-[40%] max-lg:hidden ${thStyling}`}>Author</th>
                    <th className={`w-[20%] text-center lg:w-[10%] ${thStyling}`}>
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
                <tbody className={'text-[16px] opacity-95 lg:text-[18px]'}>
                  {books.map((book) => (
                    <tr
                      key={book.id}
                      className={'border-b border-red-700/80 last:border-none lg:border-b-2'}
                    >
                      <td className={`pr-1 font-bold lg:pr-0 ${tdStyling}`}>
                        <span
                          className={`line-clamp-2 text-[16px] font-bold text-pretty md:text-[18px]`}
                        >
                          {book.title}
                        </span>
                        <span className="line-clamp-1 font-zain text-[14px] font-normal opacity-75 md:text-[16px] lg:hidden">
                          {book.author}
                        </span>
                      </td>
                      <td className={`max-lg:hidden max-lg:text-[15px] ${tdStyling}`}>
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
            {books.length > 0 && (
              <button
                onClick={() => {
                  setShowResetModal(true)
                }}
                className={`ml-auto cursor-pointer rounded-md border-b-3 border-red-700/90 bg-button/90 px-4 py-2 font-calistoga text-[14px] font-semibold tracking-wide text-text shadow-2xl transition-all hover:scale-104 hover:bg-button active:scale-96 active:opacity-100 md:bg-button/95 md:px-6 md:text-base md:font-extrabold md:tracking-wider`}
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
