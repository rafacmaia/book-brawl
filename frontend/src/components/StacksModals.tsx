import { FireIcon } from '@heroicons/react/24/solid'
import { BombIcon, PencilSimpleIcon, SwordIcon, XCircleIcon } from '@phosphor-icons/react'
import { TriangleAlert } from 'lucide-react'
import { type KeyboardEvent, useEffect, useState } from 'react'

import { ImportFeedback } from './feedback/ImportFeedback'

import type { Book, FileSource } from '@/api/types'
import { type ImportState, useImportBooks } from '@/hooks/useImportBooks'
import { Collapsible, ToggleIcon } from '@/pages/Onboarding'

// ====== CONSTANTS

const modalHeadingStyle =
  'mb-1 font-calistoga text-2xl [@media(min-height:700px)]:text-2xl font-bold tracking-wide'
const modalButtonStyle =
  'cursor-pointer rounded-t-xl rounded-b-3xl border-b-3 px-4 pb-1.25 pt-2.5 font-zain text-sm text-center [@media(min-height:700px)]:text-base font-extrabold tracking-wider text-primary drop-shadow-md transition-all md:text-lg md:pt-2.75 md:pb-1.5 hover:scale-104 active:scale-95'
const textEmphasisStyle = 'font-bold underline underline-offset-2 decoration-red-600/60'

// ====== COMPONENTS

export function ImportCSVModal({
  onClose,
  onImportSuccess,
}: {
  onClose: () => void
  onImportSuccess: () => void
}) {
  const { state, importBooks } = useImportBooks()

  const isImporting = state.type === 'loading'

  return (
    <div
      onClick={(e) => {
        if (!isImporting && e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="relative flex w-[90%] flex-col gap-4 rounded-lg border border-y-8 border-background/90 bg-button/97 p-5 font-zain text-text shadow-2xl md:w-lg md:gap-4 md:rounded-md md:border-t-8 md:border-b-8 md:p-8">
        <h2 className={`mb-1 ${modalHeadingStyle}`}>Import from a CSV</h2>
        <button
          onClick={onClose}
          disabled={isImporting}
          aria-label="Close import modal"
          className="absolute top-2 right-2 cursor-pointer text-red-800/80 transition-all hover:scale-112 active:scale-95 md:top-3 md:right-3"
        >
          <XCircleIcon weight={'duotone'} className="size-6.25 md:size-7" />
        </button>
        <div className="flex flex-col gap-3 rounded-lg bg-background/95 px-4 py-3 text-base tracking-wide text-primary/95 md:px-5 md:py-4 [@media(min-height:700px)]:text-lg">
          <p>
            If you track your books in Excel, Sheets, Notion, or anywhere with columns and rows, you
            can export it as a CSV file and throw it in here.
          </p>
          <p>
            Your file must have <span className={textEmphasisStyle}>title</span> and{' '}
            <span className={textEmphasisStyle}>author</span> columns.
          </p>
          <p>
            A <span className={textEmphasisStyle}>rating</span> column (1-10, decimals welcome) is
            optional, but encouraged. It gives a starting placement for the{' '}
            <span className={textEmphasisStyle}>
              Brawl Pit
              <span>
                <SwordIcon weight={'bold'} className="ml-1 inline -translate-y-0.5" />
              </span>
            </span>{' '}
            to put to the test.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <ChooseFileButton state={state} importBooks={importBooks} onSuccess={onImportSuccess} />
          <ImportFeedback state={state} />
        </div>
      </div>
    </div>
  )
}

export function ImportGoodreadsModal({
  onClose,
  onImportSuccess,
}: {
  onClose: () => void
  onImportSuccess: () => void
}) {
  const [openSection, setOpenSection] = useState<'instructions' | 'quirks' | null>(null)

  const { state, importBooks } = useImportBooks()

  const isImporting = state.type === 'loading'

  const sectionToggleStyle = 'flex w-full cursor-pointer text-left items-center gap-1.5 sm:gap-2'
  const h3Style = 'font-bold sm:font-extrabold underline decoration-accent/50 underline-offset-2'

  return (
    <div
      onClick={(e) => {
        if (!isImporting && e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="relative flex w-[90%] flex-col gap-4 rounded-lg border border-y-8 border-background/90 bg-button/97 p-5 font-zain text-text shadow-2xl md:w-lg md:gap-4 md:rounded-md md:border-t-8 md:border-b-8 md:p-8">
        <h2 className={`mb-1 ${modalHeadingStyle}`}>Import from Goodreads</h2>
        <button
          onClick={onClose}
          disabled={isImporting}
          aria-label="Close import modal"
          className="absolute top-2 right-2 cursor-pointer text-red-800/80 transition-all hover:scale-112 active:scale-95 md:top-3 md:right-3"
        >
          <XCircleIcon weight={'duotone'} className="size-6.25 md:size-7" />
        </button>
        <div className="flex flex-col gap-2 rounded-lg bg-background/95 px-4 py-3 text-base tracking-wide text-primary/95 md:gap-3 md:px-5 md:py-4 [@media(min-height:700px)]:text-lg">
          <p>Upload your Goodreads export file below to auto import all your books!</p>
          <div className="flex w-full flex-col gap-1">
            <button
              className={sectionToggleStyle}
              onClick={() => setOpenSection(openSection === 'instructions' ? null : 'instructions')}
              aria-expanded={openSection === 'instructions'}
            >
              <ToggleIcon variant="small" isOpen={openSection === 'instructions'} />
              <h3 className={h3Style}>How to get your export file</h3>
            </button>
            <Collapsible isOpen={openSection === 'instructions'}>
              <div
                className={
                  'mb-2 ml-1.75 flex flex-col gap-2 border-l border-primary/30 pl-3.5 sm:mb-3 sm:ml-2 sm:pl-5 sm:text-lg'
                }
              >
                <ol className="flex list-decimal flex-col gap-2 pl-4.5 marker:font-extrabold sm:pl-5">
                  <li>
                    On desktop (not the app), log in to{' '}
                    <a href={'https://goodreads.com'} target={'_blank'} rel={'noopener noreferrer'}>
                      <span
                        className={
                          'cursor-pointer font-black underline decoration-accent decoration-wavy decoration-1 underline-offset-2 transition-all hover:text-xl hover:underline-offset-1'
                        }
                      >
                        Goodreads
                      </span>
                    </a>{' '}
                    and go to <span className={textEmphasisStyle}>My Books</span>.
                  </li>
                  <li>
                    Select <span className={textEmphasisStyle}>Import and export</span> in the
                    left-side menu.
                  </li>
                  <li>
                    Under Export, click <span className={textEmphasisStyle}>Export Library</span>{' '}
                    and wait for it to generate your file.
                  </li>
                  <li>
                    Once ready, click the download link (likely named "
                    <span className={textEmphasisStyle}>Your export from...</span>") and then upload
                    it here!
                  </li>
                </ol>
              </div>
            </Collapsible>
            <button
              className={sectionToggleStyle}
              onClick={() => setOpenSection(openSection === 'quirks' ? null : 'quirks')}
              aria-expanded={openSection === 'quirks'}
            >
              <ToggleIcon variant="small" isOpen={openSection === 'quirks'} />
              <h3 className={h3Style}>Goodreads quirks</h3>
            </button>
            <Collapsible isOpen={openSection === 'quirks'}>
              <div
                className={
                  'ml-1.75 flex flex-col gap-2 border-l border-primary/30 pl-3.5 sm:mb-1 sm:ml-2 sm:pl-4 sm:text-lg'
                }
              >
                <p>
                  Goodreads often groups titles, subtitles, and series information together, which
                  makes some titles awkwardly long, and duplicates harder to catch.
                </p>
                <p>
                  After importing, you can burn any sneaky duplicates
                  <span>
                    <FireIcon className="ml-1 inline size-4 -translate-y-0.5" />
                  </span>
                  , fix a book's title and author
                  <span>
                    <PencilSimpleIcon
                      weight={'fill'}
                      className="ml-1 inline size-4 -translate-y-0.5"
                    />
                  </span>
                  , or add any missing reads.
                </p>
              </div>
            </Collapsible>
          </div>
        </div>
        <div className="flex w-full flex-col gap-4">
          <ChooseFileButton state={state} importBooks={importBooks} onSuccess={onImportSuccess} />
          <ImportFeedback state={state} />
        </div>
      </div>
    </div>
  )
}

export function DeleteModal({
  book,
  onConfirm,
  onCancel,
  error,
}: {
  book: Book
  onConfirm: () => void
  onCancel: () => void
  error: string | null
}) {
  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="flex w-[90%] flex-col justify-center gap-4 rounded-lg border border-y-6 border-red-800/80 bg-button/97 p-5 font-zain text-text shadow-2xl md:w-lg md:border-y-8 md:py-8">
        <h2 className={modalHeadingStyle}>Burn this book?</h2>
        <p className="rounded-lg bg-background/90 px-4 py-3 text-left font-zain text-base text-primary/90 md:text-xl">
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
            <FireIcon className="inline size-5.25 -translate-y-0.5 sm:-translate-y-0.5" />
          </button>
          <button
            onClick={onCancel}
            className={`flex-1 border-red-800 bg-background/90 opacity-90 hover:bg-background active:bg-background ${modalButtonStyle}`}
          >
            KEEP
          </button>
        </div>
        {error && (
          <p
            className={`w-full self-center rounded-md bg-red-800/85 px-4 py-3 text-center text-base font-extrabold text-pretty text-primary opacity-95 md:rounded-lg md:px-4 md:pb-2.75 md:text-lg md:text-primary md:opacity-90 md:brightness-110`}
          >
            <TriangleAlert strokeWidth={2.25} className={'inline size-4 md:size-4.5'} />
            <br />
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

export function EditModal({
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
      <div className="items-left relative flex w-[90%] flex-col justify-center gap-6 rounded-lg border border-y-6 border-red-800/80 bg-button/97 p-5 font-zain text-text shadow-2xl md:w-lg md:border-y-8 md:py-8">
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
              className={`w-full self-center rounded-md bg-red-800/85 px-4 py-3 text-center text-base font-extrabold text-pretty text-primary opacity-95 md:rounded-lg md:px-4 md:pb-2.75 md:text-lg md:text-primary md:opacity-90 md:brightness-110`}
            >
              <TriangleAlert strokeWidth={2.25} className={'inline size-4 md:size-4.75'} />
              <br />
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export function ResetModal({
  onConfirm,
  onCancel,
  error,
}: {
  onConfirm: () => void
  onCancel: () => void
  error: string | null
}) {
  // Resetting is a two-step process requiring a final confirmation, and the reset button is
  // disabled for a few seconds using an interval timer to prevent accidental clicks.
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
      <div className="flex w-[90%] flex-col items-center justify-center gap-4 rounded-lg border border-y-6 border-red-800/80 bg-button/97 p-5 font-zain text-text shadow-2xl md:w-lg md:border-y-8 md:p-8">
        <h2 className={`md:text-4xl ${modalHeadingStyle}`}>Burn it all?</h2>
        <p className="rounded-lg bg-background/90 px-4 py-3 text-left font-zain text-lg tracking-wide text-primary">
          This will{' '}
          <span className={'font-extrabold underline decoration-primary/70 underline-offset-2'}>
            permanently
          </span>{' '}
          delete all books, discard all brawls, and trigger a complete reset.
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
            className={`flex-3 border-red-800 bg-background hover:bg-background hover:opacity-100 active:bg-background active:opacity-90 ${modalButtonStyle} ${finalConfirmation ? 'opacity-80' : 'opacity-85'}`}
          >
            CANCEL
          </button>
        </div>
        {finalConfirmation && (
          <div className="flex w-full flex-col items-center justify-center gap-4">
            <p
              className={`rounded-lg bg-red-800 px-4 py-3 font-zain text-lg font-bold tracking-wide text-primary/92 transition-opacity ${error !== null ? 'opacity-80' : 'opacity-90'}`}
            >
              Last warning: this cannot be undone. All data will be lost. Do you wish to continue?
            </p>
            <button
              onClick={onConfirm}
              aria-label="Confirm reset"
              disabled={resetTimer > 0 || error !== null}
              className={`w-full border-background bg-red-800 pt-2.75! pb-1.75! transition-all ${resetTimer > 0 || error !== null ? 'cursor-not-allowed! opacity-85 hover:scale-100!' : 'opacity-90 hover:scale-103 hover:opacity-100 active:scale-95 active:bg-red-800'} ${modalButtonStyle}`}
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
        {error && (
          <p
            className={`w-full self-center rounded-md bg-red-800/95 px-4 py-3 text-center text-base font-extrabold text-pretty text-primary opacity-95 md:rounded-lg md:px-4 md:pb-2.75 md:text-lg md:text-primary`}
          >
            <TriangleAlert strokeWidth={2.25} className={'inline size-4 md:size-4.5'} />
            <br />
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

function ChooseFileButton({
  state,
  importBooks,
  onSuccess,
}: {
  state: ImportState
  importBooks: (file: File, source: FileSource, onSuccess?: () => void) => void
  onSuccess?: () => void
}) {
  return (
    <label
      className={`mx-auto w-1/2 border-red-600/80 bg-text/95 shadow-md hover:bg-text hover:opacity-100 ${modalButtonStyle} ${state.type === 'success' ? 'opacity-85' : 'opacity-95'}`}
    >
      {state.type === 'loading' ? 'Importing...' : 'Choose File'}
      <input
        type="file"
        accept=".csv"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void importBooks(file, 'custom', onSuccess)
          // Reset so the same file can be re-selected (file inputs don't fire OnChange
          // when the same file is selected twice)
          e.target.value = ''
        }}
        disabled={state.type === 'loading'}
        className="sr-only"
      />
    </label>
  )
}
