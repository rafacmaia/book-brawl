import { useAuth } from '@clerk/react'
import PageHeading from '../components/PageHeading'
import PlaceholderMessaging from '../components/feedback/PlaceholderMessaging.tsx'
import { Download } from 'lucide-react'
import { FireIcon as FireSolid } from '@heroicons/react/24/solid'
import { FireIcon as FireOutline } from '@heroicons/react/24/outline'
import {
  BombIcon,
  CheckCircleIcon,
  PencilSimpleLineIcon,
  ProhibitInsetIcon,
} from '@phosphor-icons/react'
import { DeleteModal, EditModal, ImportModal, ResetModal } from '../components/StacksModals.tsx'

// ====== TYPES

interface Book {
  id: number
  title: string
  author: string
}

type AddState =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'error'; message: string }
  | { type: 'success'; book: Book }

// ====== MAIN PAGE

export default function TheStacks() {
  const { getToken } = useAuth()

  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [manualAddState, setManualAddState] = useState<AddState>({ type: 'idle' })

  const [bookToBurn, setBookToBurn] = useState<Book | null>(null)
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null)
  const [editError, setEditError] = useState<string | null>(null)

  const [showImportModal, setShowImportModal] = useState<boolean>(false)
  const [showResetModal, setShowResetModal] = useState<boolean>(false)

  const titleRef = useRef<HTMLInputElement>(null)

  // --- effects
  useEffect(() => {
    void fetchBooks()
  }, [])

  // --- data fetching
  async function fetchBooks() {
    setLoading(true)
    setError(null)

    try {
      const token = await getToken()

      const response = await apiFetch('/stacks', token!)

      const data = await response.json()
      setBooks(data)
    } catch {
      setError('Failed to load books. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // --- handlers
  async function handleAdd(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const title = formData.get('title') as string
    const author = formData.get('author') as string
    const rating = formData.get('rating') as string | null

    if (!title.trim() || !author.trim()) {
      setManualAddState({ type: 'error', message: 'Please enter both title and author.' })
      return
    }

    const parsedRating = rating ? parseFloat(rating) : null
    if (parsedRating !== null && (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 10)) {
      setManualAddState({ type: 'error', message: 'Rating must be between 1 and 10.' })
      return
    }

    setManualAddState({ type: 'loading' })

    try {
      const token = await getToken()

      const response = await apiFetch('/stacks', token!, {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim(),
          rating: parsedRating,
        }),
      })

      const newBook = await response.json()

      setBooks((prev) => [newBook, ...prev])
      setManualAddState({ type: 'success', book: newBook })

      form.reset()
      titleRef.current?.focus()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        form.reset()
        setManualAddState({
          type: 'error',
          message: `${title}, by ${author}, is already in the pit!`,
        })
      } else {
        setManualAddState({
          type: 'error',
          message: `Something went wrong. Please try again.`,
        })
      }
    }
  }

  // After CSV imports, clear any UI manual entry messaging and refresh the user's book list.
  function handleImportSuccess() {
    setManualAddState({ type: 'idle' })

    void fetchBooks()
  }

  async function handleBurn(book: Book) {
    setManualAddState({ type: 'idle' })

    try {
      const token = await getToken()

      await apiFetch(`/stacks/${book.id}`, token!, { method: 'DELETE' })

      setBooks((prev) => prev.filter((b) => b.id !== book.id))
    } catch {
      setError('Failed to burn book. Please try again.')
    } finally {
      setBookToBurn(null)
    }
  }

  async function handleEdit(title: string, author: string) {
    setManualAddState({ type: 'idle' })

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

      await apiFetch(`/stacks/${bookToEdit.id}`, token!, {
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
    setManualAddState({ type: 'idle' })

    try {
      const token = await getToken()

      await apiFetch('/stacks', token!, { method: 'DELETE' })

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

  // --- styles
  const cellXPadding = 'first:pl-2.25 lg:px-2 lg:first:pl-4'
  const thStyle = `font-calistoga text-base tracking-wider pt-1.5 lg:pt-2 lg:pb-1.5 pb-1.25 font-extrabold md:text-lg lg:text-xl  ${cellXPadding}`
  const tdStyle = `py-1.25 lg:py-1.75 ${cellXPadding}`
  const inputStyle =
    'rounded-md border-b-3 border-primary/85 bg-blue-200 py-2.5 px-3 sm:p-2 shadow-lg'

  return (
    <main className="mx-auto flex h-full min-h-0 w-[97%] grow flex-col items-center gap-4 overflow-y-auto px-2 pb-2 text-primary/95 sm:max-w-6xl sm:gap-4 md:p-4">
      <PageHeading title={'The Stacks'} style={'mb-5 mt-2 max-md:hidden'} />

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
        <PlaceholderMessaging message={error} />
      ) : loading ? (
        <PlaceholderMessaging message="Fetching the Stacks..." />
      ) : (
        <>
          {/* MANUAL INPUT */}
          <section
            className={`mt-0 flex w-full flex-col gap-4 [@media(min-height:700px)]:mt-1.5 [@media(min-height:700px)]:md:mt-2 ${manualAddState.type === 'idle' ? 'md:mb-15' : 'mb-0'}`}
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

            <AddFeedback addState={manualAddState} />
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

            {/* Reset button */}
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

// ====== HELPERS

// Displays add-feedback for the manual entry form: loading, error, or success.
function AddFeedback({ addState }: { addState: AddState }) {
  const addMessageStyle = `w-full md:self-end rounded-md md:rounded-lg bg-button px-4 pb-1.75 pt-2.25 text-lg md:w-fit md:px-6 md:text-xl md:brightness-110`
  const iconStyle = 'mr-1.5 inline size-5 -translate-y-0.5 md:size-5.25 '

  switch (addState.type) {
    case 'idle':
      return null

    case 'loading':
      return (
        <p className={`font-bold text-text opacity-80 ${addMessageStyle}`}>Updating the pit...</p>
      )

    case 'error':
      return (
        <p className={`font-extrabold text-red-800 opacity-96 md:opacity-90 ${addMessageStyle}`}>
          <ProhibitInsetIcon weight={'duotone'} className={iconStyle} />
          {addState.message}
        </p>
      )

    case 'success': {
      const bookDataStyle = 'font-bold decoration-accent/70 underline-offset-3 md:underline'
      return (
        <p className={`text-text ${addMessageStyle}`}>
          <CheckCircleIcon weight={'duotone'} className={`md:-translate-y-0.75 ${iconStyle}`} />
          Added: <span className={`md:ml-1 ${bookDataStyle}`}>{addState.book.title}</span>, by{' '}
          <span className={bookDataStyle}>{addState.book.author}</span>
        </p>
      )
    }
  }
}
