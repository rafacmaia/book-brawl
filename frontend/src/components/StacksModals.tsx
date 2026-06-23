import { FireIcon } from '@heroicons/react/24/solid'
import { BombIcon, PencilSimpleIcon, XCircleIcon } from '@phosphor-icons/react'
import { TriangleAlert } from 'lucide-react'
import { type KeyboardEvent, type ReactNode, useEffect, useState } from 'react'

import type { Book } from '@/api/types'
import { ChooseFileButton } from '@/components/import/ChooseFileButton'
import { CustomCSVInstructions } from '@/components/import/CustomCSVInstructions'
import {
  GoodreadsInstructions,
  type GoodreadsSections,
} from '@/components/import/GoodreadsInstructions'
import { ImportFeedback } from '@/components/import/ImportFeedback'
import { useImportBooks } from '@/hooks/useImportBooks'

// ====== CONSTANTS

const modalButtonStyle =
  'cursor-pointer rounded-t-xl rounded-b-3xl border-b-3 px-4 pb-1.25 pt-2.5 font-zain text-sm text-center [@media(min-height:700px)]:text-base font-extrabold tracking-wider text-primary drop-shadow-md transition-all md:text-lg md:pt-2.75 md:pb-1.5 hover:scale-104 active:scale-95'
const chooseFileButtonStyle = `mx-auto w-1/2 border-red-600/80 bg-text/95 shadow-md hover:bg-text hover:opacity-100 ${modalButtonStyle}`
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
    <Modal heading="Import from a CSV" isActive={isImporting} onClose={onClose}>
      <button
        onClick={onClose}
        disabled={isImporting}
        aria-label="Close import modal"
        className="absolute top-2 right-2 cursor-pointer text-red-800/80 transition-all hover:scale-112 active:scale-95 md:top-3 md:right-3"
      >
        <XCircleIcon weight={'duotone'} className="size-6.25 md:size-7" />
      </button>
      <div className="flex flex-col gap-3 rounded-lg bg-background/95 px-4 py-3 text-base tracking-wide text-primary/95 md:px-5 md:py-4 [@media(min-height:700px)]:text-lg">
        <CustomCSVInstructions />
      </div>
      <div className="flex flex-col gap-4">
        <ChooseFileButton
          isLoading={state.type === 'loading'}
          onFileSelect={(file) => importBooks(file, 'custom', onImportSuccess)}
          className={`${chooseFileButtonStyle} ${state.type === 'success' ? 'opacity-85' : 'opacity-95'}`}
        />
        <ImportFeedback state={state} />
      </div>
    </Modal>
  )
}

export function ImportGoodreadsModal({
  onClose,
  onImportSuccess,
}: {
  onClose: () => void
  onImportSuccess: () => void
}) {
  const [openSection, setOpenSection] = useState<GoodreadsSections>(null)

  const { state, importBooks } = useImportBooks()

  const isImporting = state.type === 'loading'

  return (
    <Modal heading="Import from Goodreads" isActive={isImporting} onClose={onClose}>
      <button
        onClick={onClose}
        disabled={isImporting}
        aria-label="Close import modal"
        className="absolute top-2 right-2 cursor-pointer text-red-800/80 transition-all hover:scale-112 active:scale-95 md:top-3 md:right-3"
      >
        <XCircleIcon weight={'duotone'} className="size-6.25 md:size-7" />
      </button>
      <div className="flex flex-col gap-2 rounded-lg bg-background/95 px-4 py-3 text-base tracking-wide text-primary/95 md:gap-3 md:px-5 md:py-4 [@media(min-height:700px)]:text-lg">
        <GoodreadsInstructions
          openSection={openSection}
          setOpenSection={setOpenSection}
          quirksNote={
            <p>
              After importing, you can burn any sneaky duplicates
              <span>
                <FireIcon className="ml-1 inline size-4 -translate-y-0.5" />
              </span>
              , fix a book's title and author
              <span>
                <PencilSimpleIcon weight={'fill'} className="ml-1 inline size-4 -translate-y-0.5" />
              </span>
              , or add any missing reads.
            </p>
          }
        />
      </div>
      <ChooseFileButton
        isLoading={state.type === 'loading'}
        onFileSelect={(file) => {
          setOpenSection(null)
          void importBooks(file, 'goodreads', onImportSuccess)
        }}
        className={`${chooseFileButtonStyle} ${state.type === 'success' ? 'opacity-85' : 'opacity-95'}`}
      />
      <ImportFeedback state={state} />
    </Modal>
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
    <Modal heading="Burn this Book?" onClose={onCancel} variant="red">
      <p className="rounded-lg bg-background/90 px-4 py-3 text-left font-zain text-base text-primary/90 md:text-xl">
        <span className={`font-calistoga text-emphasis tracking-wider`}>{book.title}</span>, by{' '}
        <span className={`font-calistoga text-emphasis tracking-wider`}>{book.author}</span>, will
        be permanently removed from the Book Pit.
      </p>
      <div className="flex w-full gap-4">
        <button
          onClick={onConfirm}
          className={`flex-1 border-background bg-red-800/80 hover:bg-red-800 active:bg-red-800 ${modalButtonStyle}`}
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
    </Modal>
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
    <Modal heading="Edit Book" onClose={onCancel} variant="red">
      <button
        onClick={onCancel}
        aria-label="Close edit modal"
        className="absolute top-2 right-2 cursor-pointer text-red-800/80 transition-all hover:scale-112 active:scale-95 md:top-3 md:right-3"
      >
        <XCircleIcon weight={'duotone'} className="size-6.25 md:size-7" />
      </button>
      <div className="flex flex-col gap-2.5 font-zain text-base md:text-lg">
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
    </Modal>
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
    <Modal heading="Burn it all?" onClose={onCancel} variant="red">
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
    </Modal>
  )
}

function Modal({
  children,
  heading,
  onClose,
  isActive = false,
  variant = 'blue',
}: {
  children: ReactNode
  heading: string
  onClose: () => void
  isActive?: boolean
  variant?: 'blue' | 'red'
}) {
  const borderColor = variant === 'red' ? 'border-red-800/80' : 'border-background/90'

  return (
    <div
      onClick={(e) => {
        if (!isActive && e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 py-4 md:items-center"
    >
      <div
        className={`relative my-auto flex max-h-[calc(100vh-2rem)] w-[90%] flex-col gap-4 overflow-y-auto rounded-lg border border-y-8 bg-button/97 p-4 font-zain text-text shadow-2xl md:w-lg md:gap-4 md:rounded-md md:border-t-8 md:border-b-8 md:p-8 ${borderColor}`}
      >
        <h2 className={`font-calistoga text-2xl font-bold tracking-wide md:text-3xl`}>{heading}</h2>
        {children}
      </div>
    </div>
  )
}
