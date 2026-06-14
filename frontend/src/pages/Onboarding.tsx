import { BooksIcon, CaretCircleRightIcon, CaretRightIcon, SwordIcon } from '@phosphor-icons/react'
import { type ReactNode, useState } from 'react'
import { NavLink } from 'react-router-dom'

import type { FileSource } from '@/api/types'
import { ImportFeedback } from '@/components/feedback/ImportFeedback'
import { ManualAddForm } from '@/components/ManualAddForm'
import { useAddBook } from '@/hooks/useAddBook'
import { type ImportState, useImportBooks } from '@/hooks/useImportBooks'

type OnboardingSection = 'goodreads' | 'manual' | 'custom' | null

// ====== STYLE CONSTANTS

const width = 'w-full sm:w-[34rem]'
const sectionStyle = `flex flex-col items-center justify-center py-2 px-2 border-2 rounded-lg sm:p-3 sm:pt-3.25 ${width}`
const toggleOptionStyle = 'flex w-full items-center gap-2 cursor-pointer'
const toggleHeadingStyle = 'text-lg sm:text-2xl font-extrabold tracking-wide'
const textEmphasisStyle = 'font-extrabold underline decoration-accent/70 underline-offset-1'

// ====== COMPONENTS

export default function Onboarding() {
  const [openSection, setOpenSection] = useState<OnboardingSection>(null)

  const [hasAddedBooks, setHasAddedBooks] = useState(false)

  return (
    <main className="flex grow flex-col items-center justify-center gap-4 px-4 py-4 text-primary/95 sm:gap-6 sm:px-8">
      {/* HEADING */}
      <div
        className={`flex flex-col gap-2 p-1 text-2xl font-bold tracking-wide sm:gap-4 sm:text-3xl ${width}`}
      >
        <BooksIcon
          weight="light"
          className="inline size-14 -translate-x-2.25 text-primary/90 sm:size-18"
        />
        <h1 className={`md:leading-normal`}>
          To find the one book to rule them all, we must first add some contenders.
        </h1>
      </div>

      {/* GOODREADS IMPORT */}
      <section
        className={`${sectionStyle} ${openSection === 'goodreads' ? 'border-primary/80' : 'border-primary/25'}`}
      >
        <button
          onClick={() => setOpenSection(openSection === 'goodreads' ? null : 'goodreads')}
          className={toggleOptionStyle}
          aria-expanded={openSection === 'goodreads'}
        >
          <ToggleIcon isOpen={openSection === 'goodreads'} />
          <h2 className={toggleHeadingStyle}>Import from Goodreads</h2>
        </button>
        <Collapsible isOpen={openSection === 'goodreads'}>
          <GoodreadsImport onSuccess={() => setHasAddedBooks(true)} />
        </Collapsible>
      </section>

      {/* MANUAL ENTRY */}
      <section
        className={`${sectionStyle} ${openSection === 'manual' ? 'border-primary/80' : 'border-primary/25'}`}
      >
        <button
          onClick={() => setOpenSection(openSection === 'manual' ? null : 'manual')}
          className={toggleOptionStyle}
          aria-expanded={openSection === 'manual'}
        >
          <ToggleIcon isOpen={openSection === 'manual'} />
          <h2 className={toggleHeadingStyle}>Manual Entry</h2>
        </button>
        <Collapsible isOpen={openSection === 'manual'}>
          <ManualEntry onSuccess={() => setHasAddedBooks(true)} />
        </Collapsible>
      </section>

      {/* CUSTOM CSV */}
      <section
        className={`${sectionStyle} ${openSection === 'custom' ? 'border-primary/80' : 'border-primary/25'}`}
      >
        <button
          onClick={() => setOpenSection(openSection === 'custom' ? null : 'custom')}
          className={toggleOptionStyle}
          aria-expanded={openSection === 'custom'}
        >
          <ToggleIcon isOpen={openSection === 'custom'} />
          <h2 className={toggleHeadingStyle}>Custom CSV</h2>
        </button>
        <Collapsible isOpen={openSection === 'custom'}>
          <CustomCSV onSuccess={() => setHasAddedBooks(true)} />
        </Collapsible>
      </section>

      {/* CONTINUE */}
      <NavLink
        to={'/brawl'}
        className={`flex cursor-pointer items-center justify-end gap-1 p-1 text-lg font-bold tracking-wide sm:text-xl ${width} ${hasAddedBooks ? 'animate-pulse' : ''}`}
      >
        {hasAddedBooks ? (
          <>
            <p>Ready to Brawl?</p>
            <SwordIcon weight="duotone" className="inline size-5 -translate-y-px sm:size-5.5" />
          </>
        ) : (
          <>
            <p>Skip for now</p>
            <CaretRightIcon
              weight="duotone"
              className="inline size-5 -translate-y-px sm:size-5.5"
            />
          </>
        )}
      </NavLink>
    </main>
  )
}

// --- SECTIONS

const collapsibleDivStyle =
  'mt-1.25 flex w-full flex-col items-start justify-center border-t border-primary/30 p-1 pt-3 tracking-wide leading-normal text-primary text-base text-pretty sm:mt-2 sm:text-xl sm:pt-4'

function GoodreadsImport({ onSuccess }: { onSuccess?: () => void }) {
  const { state, importBooks } = useImportBooks()

  const [openSection, setOpenSection] = useState<'instructions' | 'quirks' | null>(null)

  const sectionToggleStyle = 'flex w-full cursor-pointer text-left items-center gap-1.5 sm:gap-2'
  const h3Style = 'font-bold sm:font-extrabold underline decoration-accent/50 underline-offset-2'

  return (
    <div className={collapsibleDivStyle}>
      <p>Upload your Goodreads export file below to auto import all your books!</p>
      <div className="my-2 flex w-full flex-col gap-1 border-b border-primary/30 pb-2 sm:mt-4 sm:mb-4 sm:gap-2">
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
                On desktop (not the app), log in to Goodreads and go to{' '}
                <span className={textEmphasisStyle}>My Books</span>.
              </li>
              <li>
                Select <span className={textEmphasisStyle}>Import and export</span> in the left-side
                menu.
              </li>
              <li>
                Under Export, click <span className={textEmphasisStyle}>Export Library</span> and
                wait for it to generate your file.
              </li>
              <li>
                Once ready, click the download link (likely named "
                <span className={textEmphasisStyle}>Your export from...</span>").
              </li>
              <li>Throw the file in here and we'll do the rest!</li>
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
              Goodreads often groups titles, subtitles, and series information together, which makes
              some titles awkwardly long, and duplicates harder to catch.
            </p>
            <p>
              You'll be able to delete sneaky duplicates, fix a book's title and author, or add any
              missing reads, in{' '}
              <span className={`font-extrabold`}>
                The{' '}
                <span className={'whitespace-nowrap'}>
                  Stacks
                  <span>
                    <BooksIcon weight={'bold'} className="ml-1 inline -translate-y-0.5" />
                  </span>
                </span>
              </span>{' '}
              page anytime.
            </p>
          </div>
        </Collapsible>
      </div>

      <ChooseFileButton
        onImport={importBooks}
        source="goodreads"
        isLoading={state.type === 'loading'}
        onSuccess={onSuccess}
      />
      <ImportOutcome state={state} />
    </div>
  )
}

function ManualEntry({ onSuccess }: { onSuccess?: () => void }) {
  const { state: addState, addBook } = useAddBook()

  return (
    <div className={`gap-2 sm:gap-3 ${collapsibleDivStyle}`}>
      <p>Add as many worthy contenders as you'd like by providing the info below for each.</p>
      <p className={'mb-1 border-b border-primary/30 pb-3 sm:pb-4'}>
        <span className={textEmphasisStyle}>Rating</span> (1-10, decimals welcome) is optional, but
        encouraged. It provides an initial placement for the{' '}
        <span className={`font-extrabold`}>
          Brawl Pit
          <span>
            <SwordIcon weight={'bold'} className="ml-1 inline -translate-y-0.5" />
          </span>
        </span>{' '}
        to put to the test.
      </p>

      <ManualAddForm
        addState={addState}
        addBook={addBook}
        onSuccess={onSuccess}
        variant="compact"
      />

      {addState.type === 'success' && <StacksMessage />}
    </div>
  )
}

function CustomCSV({ onSuccess }: { onSuccess?: () => void }) {
  const { state, importBooks } = useImportBooks()

  return (
    <div className={`gap-2 sm:gap-3 ${collapsibleDivStyle}`}>
      <p>
        If you track your books in a spreadsheet — Excel, Google Sheets, Notion, anywhere with
        columns and rows — you can export or download it as a CSV file and throw it in here.
      </p>
      <p>
        Your file must have <span className={textEmphasisStyle}>title</span> and{' '}
        <span className={textEmphasisStyle}>author</span> columns.
      </p>
      <p className={'mb-1 border-b border-primary/30 pb-3 sm:pb-4'}>
        A <span className={textEmphasisStyle}>rating</span> column (1-10, decimals welcome) is
        optional, but encouraged. It provides an initial placement for the{' '}
        <span className={textEmphasisStyle}>
          Brawl Pit
          <span>
            <SwordIcon weight={'bold'} className="ml-1 inline -translate-y-0.5" />
          </span>
        </span>{' '}
        to put to the test.
      </p>
      <ChooseFileButton
        onImport={importBooks}
        source="custom"
        isLoading={state.type === 'loading'}
        onSuccess={onSuccess}
      />
      <ImportOutcome state={state} />
    </div>
  )
}

// --- PRIMITIVES

const chooseFileButtonStyle =
  'cursor-pointer w-1/2 sm:w-2/5 rounded-lg border-b-3 px-6 pb-1.25 pt-2.25 font-zain text-sm text-center [@media(min-height:700px)]:text-base font-extrabold tracking-wide text-text drop-shadow-md transition-all [@media(min-height:700px)]:sm:text-lg sm:pt-2.75 sm:pb-1.5 hover:scale-104 active:scale-95'

function Collapsible({ isOpen, children }: { isOpen: boolean; children: ReactNode }) {
  return (
    <div
      className={`grid w-full transition-[grid-template-rows] duration-600 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
    >
      <div className={`overflow-hidden`}>{children}</div>
    </div>
  )
}

function ChooseFileButton({
  onImport,
  source,
  isLoading,
  onSuccess,
}: {
  onImport: (file: File, source: FileSource, onSuccess?: () => void) => void
  source: FileSource
  isLoading: boolean
  onSuccess?: () => void
}) {
  return (
    <label
      className={`my-1 self-center border-red-600/80 bg-button/95 shadow-md hover:bg-primary ${chooseFileButtonStyle}`}
    >
      {isLoading ? 'Importing...' : 'Choose File'}
      <input
        type="file"
        accept=".csv"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void onImport(file, source, onSuccess)
          // Reset so the same file can be re-selected (file inputs don't fire OnChange when the
          // same file is selected twice)
          e.target.value = ''
        }}
        disabled={isLoading}
        className="sr-only"
      />
    </label>
  )
}

function ImportOutcome({ state }: { state: ImportState }) {
  if (state.type !== 'success' && state.type !== 'error') return null

  return (
    <div className={'flex w-full flex-col gap-2 sm:mt-2 sm:gap-3'}>
      <ImportFeedback state={state} variant="compact" />
      {state.type === 'success' && state.result.imported > 0 && <StacksMessage />}
    </div>
  )
}

function StacksMessage() {
  return (
    <div
      className={
        'flex w-full flex-col gap-1 rounded-lg bg-button px-3 py-2 text-base font-semibold text-pretty text-text sm:px-4 sm:py-3 sm:text-lg'
      }
    >
      <p>
        <span className={'font-extrabold'}>Please note:</span> You can add new reads, and view,
        edit, or delete existing ones, anytime, in{' '}
        <NavLink to={'/stacks'} className={textEmphasisStyle}>
          The{' '}
          <span className={'whitespace-nowrap'}>
            Stacks
            <span>
              <BooksIcon weight={'bold'} className="ml-1 inline -translate-y-0.5" />
            </span>
          </span>
        </NavLink>
        .
      </p>
    </div>
  )
}

function ToggleIcon({
  isOpen,
  variant = 'default',
}: {
  isOpen?: boolean
  variant?: 'default' | 'small'
}) {
  const size = variant === 'small' ? 'size-3.5 sm:size-4.25' : 'size-4.5 sm:size-5'

  return (
    <CaretCircleRightIcon
      weight="duotone"
      className={`inline -translate-y-0.5 transition-transform duration-350 ${size} ${isOpen ? 'rotate-90' : 'rotate-0'}`}
    />
  )
}
