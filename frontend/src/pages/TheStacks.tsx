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

const modalHeadingStyle =
  'mb-1 font-calistoga text-2xl [@media(min-height:700px)]:text-3xl font-bold tracking-wide'
const modalButtonStyle =
  'cursor-pointer rounded-t-lg rounded-b-3xl border-b-3 px-4 pb-1.25 pt-2.5 font-zain text-sm text-center [@media(min-height:700px)]:text-base font-extrabold tracking-wider text-primary drop-shadow-md transition-all md:text-lg md:pt-2.75 md:pb-1.5 hover:scale-104 active:scale-95'
const textEmphasisStyle = 'font-bold underline underline-offset-2 decoration-red-600/60'

function ImportModal({
  onClose,
  onImportSuccess,
}: {
  onClose: () => void
  onImportSuccess: () => void
}) {
  const { getToken } = useAuth()

  const [loadingGoodreads, setLoadingGoodreads] = useState(false)
  const [loadingCustom, setLoadingCustom] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  const isImporting = loadingGoodreads || loadingCustom

  async function handleFileUpload(
    e: ChangeEvent<HTMLInputElement>,
    source: 'custom' | 'goodreads'
  ) {
    const file = e.target.files?.[0]
    if (!file) return

    if (source === 'goodreads') {
      setLoadingGoodreads(true)
    } else {
      setLoadingCustom(true)
    }
    setError(null)
    setResult(null)

    try {
      const token = await getToken()
      const formData = new FormData()
      formData.append('file', file)
      formData.append('source', source)

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
      onImportSuccess()
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoadingCustom(false)
      setLoadingGoodreads(false)
    }
  }

  return (
    <div
      onClick={(e) => {
        if (!isImporting && e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="relative flex w-[90%] flex-col gap-4 rounded-lg border border-y-8 border-background/90 bg-button/97 px-6 py-5 font-zain text-text shadow-2xl md:w-lg md:gap-4 md:rounded-md md:border-t-8 md:border-b-8 md:p-8">
        <h2 className={`mb-2 ${modalHeadingStyle}`}>Import from a CSV</h2>
        <button
          onClick={onClose}
          disabled={isImporting}
          aria-label="Close edit modal"
          className="absolute top-2 right-2 cursor-pointer text-red-800/80 transition-all hover:scale-112 active:scale-95 md:top-3 md:right-3"
        >
          <XCircleIcon weight={'duotone'} className="size-6.25 md:size-7" />
        </button>
        <div className="flex flex-col gap-3 rounded-lg bg-background/95 px-4 py-3 text-base tracking-wide text-primary/95 md:px-5 md:py-4 [@media(min-height:700px)]:text-lg">
          <p className="border-b border-button/60 pb-2 font-bold">
            You can import from a <span className={textEmphasisStyle}>custom CSV</span> or a{' '}
            <span className={textEmphasisStyle}>Goodreads</span> export file.
          </p>
          <p>
            If using a custom file, it must have <span className={textEmphasisStyle}>title</span>{' '}
            and <span className={textEmphasisStyle}>author</span> columns.
          </p>
          <p>
            A <span className={textEmphasisStyle}>rating</span> column (1–10, decimals welcome) is
            encouraged, but optional.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <label
              className={`flex-1 border-red-600/80 bg-text/95 shadow-md hover:bg-text hover:opacity-100 ${modalButtonStyle} ${result ? 'opacity-85' : 'opacity-95'}`}
            >
              {loadingCustom ? 'Importing...' : 'CUSTOM'}
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload(e, 'custom')}
                disabled={isImporting}
                className="sr-only"
              />
            </label>
            <label
              className={`flex-1 border-red-600/80 bg-text/95 shadow-md hover:bg-text hover:opacity-100 ${modalButtonStyle} ${result ? 'opacity-85' : 'opacity-95'}`}
            >
              {loadingGoodreads ? 'Importing...' : 'GOODREADS'}
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload(e, 'goodreads')}
                disabled={isImporting}
                className="sr-only"
              />
            </label>
          </div>
          {error && <p className="mt-1 pl-1 text-lg font-bold text-red-700">{error}</p>}
          {result && (
            <div className="mt-1 flex flex-col gap-2 pl-2 text-lg font-extrabold tracking-wide md:text-xl">
              {result.skipped > 0 && (
                <p className="text-text">
                  <SkipForwardCircleIcon
                    weight={'fill'}
                    aria-label="Edit this book"
                    className="mr-1 inline size-5.25 -translate-y-0.5 opacity-90 md:size-5.75"
                  />{' '}
                  {result.skipped} {result.skipped === 1 ? 'book' : 'books'} skipped.
                </p>
              )}
              {result.imported > 0 ? (
                <p className="text-text">
                  <CheckCircleIcon
                    weight={'fill'}
                    aria-label="Edit this book"
                    className="mr-1 inline size-5.25 -translate-y-0.5 opacity-90 md:size-5.75"
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
                    className="mr-1 inline size-5.25 -translate-y-0.5 opacity-90 md:size-5.75"
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
  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="flex w-[90%] flex-col justify-center gap-4 rounded-lg border border-y-6 border-red-800/80 bg-button/97 px-8 py-6 font-zain text-text shadow-2xl md:w-lg md:border-y-8 md:py-8">
        <h2 className={modalHeadingStyle}>Burn this book?</h2>
        <p className="rounded-lg bg-background/90 px-4 py-3 text-left font-zain text-base text-primary/90 md:text-xl [@media(min-height:700px)]:text-lg">
          <span className={`font-calistoga tracking-wider ${textEmphasisStyle}`}>{book.title}</span>
          , by{' '}
          <span className={`font-calistoga tracking-wider ${textEmphasisStyle}`}>
            {book.author}
          </span>
          , will be permanently removed from the Book Pit.
        </p>
        <div className="flex w-full gap-4">
          <button
            onClick={onConfirm}
            className={`flex-1 border-background bg-red-800/75 hover:bg-red-800 active:bg-red-800 ${modalButtonStyle}`}
          >
            <FireSolid className="inline size-5.25 -translate-y-0.5 sm:-translate-y-0.5" />
          </button>
          <button
            onClick={onCancel}
            className={`flex-1 border-red-800 bg-background/90 opacity-90 hover:bg-background active:bg-background ${modalButtonStyle}`}
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
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="items-left relative flex w-[90%] flex-col justify-center gap-6 rounded-lg border border-y-6 border-red-800/80 bg-button/97 px-8 py-6 font-zain text-text shadow-2xl md:w-lg md:border-y-8 md:py-8">
        <h2 className={modalHeadingStyle}>Edit Book</h2>
        <button
          onClick={onCancel}
          aria-label="Close edit modal"
          className="absolute top-2 right-2 cursor-pointer text-red-800/80 transition-all hover:scale-112 active:scale-95 md:top-3 md:right-3"
        >
          <XCircleIcon weight={'duotone'} className="size-6.25 md:size-7" />
        </button>
        <div className="flex flex-col gap-3 font-zain text-base md:text-lg">
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
            className={`w-full border-red-800/85 bg-background/90 hover:border-background/90 hover:bg-red-800 active:bg-red-800 ${modalButtonStyle}`}
          >
            SAVE
          </button>
          {error && (
            <p
              className={`w-full self-center rounded-md bg-red-800/85 px-4 py-3 text-left text-base font-extrabold text-primary opacity-95 md:rounded-lg md:px-4 md:pt-2.5 md:text-lg md:text-primary md:opacity-90 md:brightness-110`}
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

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="flex w-[90%] flex-col items-center justify-center gap-4 rounded-lg border border-y-6 border-red-800/80 bg-button/97 p-6 font-zain text-text shadow-2xl md:w-lg md:border-y-8 md:p-8">
        <h2 className={`md:text-4xl ${modalHeadingStyle}`}>Burn it all?</h2>
        <p className="rounded-lg bg-background/90 px-4 py-3 text-left font-zain text-lg tracking-wide text-primary">
          This will{' '}
          <span className={'font-extrabold underline decoration-primary/70 underline-offset-2'}>
            permanently
          </span>{' '}
          delete all books and trigger a complete Pit reset.
        </p>
        <div className="flex w-full items-center justify-center gap-4">
          <button
            onClick={() => setFinalConfirmation(true)}
            disabled={finalConfirmation}
            aria-label="Delete all books and reset the pit"
            className={`flex-2 border-background bg-red-800/75 ${modalButtonStyle} ${finalConfirmation ? 'cursor-not-allowed! hover:scale-100! active:scale-100!' : 'hover:bg-red-800 active:bg-red-800'}`}
          >
            RESET
          </button>
          <button
            onClick={onCancel}
            aria-label="Close reset modal and cancel reset"
            className={`flex-3 border-red-800 bg-background hover:bg-background hover:opacity-100 active:bg-background active:opacity-90 ${modalButtonStyle} ${finalConfirmation ? 'opacity-85' : 'opacity-75'}`}
          >
            CANCEL
          </button>
        </div>
        {finalConfirmation && (
          <div className="flex w-full flex-col items-center justify-center gap-4">
            <p className="rounded-lg bg-red-800/85 px-4 py-3 font-zain text-lg font-extrabold tracking-wide text-primary/92">
              Last warning: this cannot be undone. All data will be lost. Do you wish to continue?
            </p>
            <button
              onClick={onConfirm}
              aria-label="Confirm reset"
              disabled={resetTimer > 0}
              className={`w-full border-background bg-red-800/85 pt-2.75! pb-1.75! hover:bg-red-800 active:bg-red-800 ${resetTimer === 0 ? 'hover:scale-104 active:scale-95' : 'cursor-not-allowed!'} ${modalButtonStyle}`}
            >
              {resetTimer > 0 ? (
                `Wait... ${resetTimer}`
              ) : (
                <BombIcon
                  weight={'fill'}
                  className={`inline size-4.75 -translate-y-0.5 drop-shadow-2xl drop-shadow-zinc-950 sm:-translate-y-0.5`}
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

export default function TheStacks() {
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
  const thStyle = `font-calistoga text-base tracking-wider pt-1.5 lg:pt-2 lg:pb-1.5 pb-1.25 font-extrabold md:text-lg lg:text-xl  ${cellXPadding}`
  const tdStyle = `py-1.25 lg:py-1.75 ${cellXPadding}`
  const inputStyle =
    'rounded-md border-b-3 border-primary/85 bg-blue-200 py-2.5 px-3 sm:p-2 shadow-lg'
  const addMessageStyle = `w-full md:self-end rounded-md md:rounded-lg bg-button px-4 pb-1.75 pt-2.25 text-lg md:w-fit md:px-6 md:text-xl md:brightness-110`

  const addTriggered = newBook != null || addError != null || loadingAdd

  return (
    <main className="mx-auto flex h-full min-h-0 w-[97%] grow flex-col items-center gap-4 overflow-y-auto px-2 pb-2 text-primary/95 sm:max-w-6xl sm:gap-4 md:p-4">
      <PageHeading title={'The Stacks'} style={'mb-5 max-md:hidden'} />

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
            className={`mt-0 flex w-full flex-col gap-4 [@media(min-height:700px)]:mt-1.5 [@media(min-height:700px)]:md:mt-2 ${addTriggered ? 'mb-0' : 'md:mb-15'}`}
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
                className={`md:w-[48%] ${inputStyle}`}
              />
              <input
                aria-label="Enter book author"
                type="text"
                placeholder="Author"
                name="author"
                className={`md:w-[30%] ${inputStyle}`}
              />
              <input
                aria-label="Enter optional rating (1-10, decimals welcome)"
                type="number"
                min="1"
                max="10"
                step="0.1"
                placeholder="Rating"
                name="rating"
                className={`md:w-[11%] ${inputStyle}`}
              />
              <button
                type="submit"
                title={'Add new book'}
                className="cursor-pointer rounded-md border-b-3 border-primary/75 bg-accent/80 pt-2.25 pb-1.5 text-center font-zain text-lg font-extrabold text-primary/90 shadow-md transition-all hover:scale-102 hover:bg-accent/85 active:scale-97 active:bg-accent/70 md:w-[8%] md:bg-accent/75 md:pt-1.75 md:pb-0.75 md:text-xl"
              >
                <span className="inline md:hidden">Add Book</span>
                <span className="hidden md:inline">Add</span>
              </button>
            </form>
            {addError && (
              <p
                className={`font-extrabold text-red-800 opacity-96 md:opacity-90 ${addMessageStyle}`}
              >
                <ProhibitInsetIcon
                  weight={'duotone'}
                  className={'mr-1.5 inline size-5 -translate-y-0.5 md:size-5.25'}
                />
                {addError}
              </p>
            )}

            {newBook && (
              <p className={`text-text ${addMessageStyle}`}>
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
              <p className={`font-bold text-text opacity-80 ${addMessageStyle}`}>
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
                  'text-md h-fit w-fit rounded-md bg-button px-4 py-2 font-calistoga font-bold tracking-wide text-text shadow-2xl md:text-xl'
                }
              >
                {books.length} Book{books.length !== 1 && 's'}
              </p>
              <button
                onClick={() => {
                  setShowImportModal(true)
                }}
                className={`text-md cursor-pointer rounded-full border-b-3 border-red-700/75 bg-button/95 px-6 pt-1.75 pb-1.5 font-calistoga font-bold tracking-wider text-text shadow-2xl transition-all hover:scale-104 hover:bg-button active:scale-96 active:opacity-90 md:bg-button/95 md:text-lg`}
              >
                <Download
                  className={
                    'mr-1.25 inline size-3.75 -translate-y-px stroke-3 drop-shadow-2xl drop-shadow-zinc-950 md:mr-1.5 md:size-4.25 md:stroke-4'
                  }
                />
                CSV
              </button>
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
            {books.length > 0 && (
              <button
                onClick={() => {
                  setShowResetModal(true)
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
