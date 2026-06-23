import { BooksIcon, CaretRightIcon, SwordIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'

import { ChooseFileButton } from '@/components/import/ChooseFileButton'
import { CustomCSVInstructions } from '@/components/import/CustomCSVInstructions'
import {
  GoodreadsInstructions,
  type GoodreadsSections,
} from '@/components/import/GoodreadsInstructions'
import { ImportFeedback } from '@/components/import/ImportFeedback'
import { ManualAddForm } from '@/components/ManualAddForm'
import { Collapsible } from '@/components/ui/Collapsible'
import { ToggleIcon } from '@/components/ui/ToggleIcon'
import { useAddBook } from '@/hooks/useAddBook'
import { type ImportState, useImportBooks } from '@/hooks/useImportBooks'

type OnboardingSection = 'goodreads' | 'manual' | 'custom' | null

// ====== STYLE CONSTANTS

const width = 'w-full sm:w-[34rem]'

const sectionStyle = `flex flex-col items-center justify-center py-2 px-2 border-2 rounded-lg sm:p-3 sm:pt-3.25 ${width}`

const toggleOptionStyle = 'flex w-full items-center gap-2 cursor-pointer'

const toggleHeadingStyle = 'text-lg sm:text-2xl font-extrabold tracking-wide'

const collapsibleDivStyle =
  'mt-1.25 flex w-full flex-col items-start justify-center border-t border-primary/30 p-1 pt-3 tracking-wide leading-normal text-primary text-base text-pretty sm:mt-2 sm:text-xl sm:pt-4'

const chooseFileButtonStyle =
  'cursor-pointer w-1/2 sm:w-2/5 rounded-lg border-b-3 px-6 pb-1.25 pt-2.25 font-zain text-sm text-center [@media(min-height:700px)]:text-base font-extrabold tracking-wide text-text drop-shadow-md transition-all [@media(min-height:700px)]:sm:text-lg sm:pt-2.75 sm:pb-1.5 hover:scale-104 active:scale-95'

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
        className={`flex cursor-pointer items-center justify-end gap-1 p-1 font-bold ${width} ${hasAddedBooks ? 'animate-pulse' : ''}`}
      >
        {hasAddedBooks ? (
          <>
            <p className={`text-xl tracking-wider sm:text-2xl`}>Ready to Brawl?</p>
            <SwordIcon
              weight="duotone"
              className="inline size-5.5 -translate-y-px sm:ml-1 sm:size-7"
            />
          </>
        ) : (
          <>
            <p className={'text-lg tracking-wide sm:text-xl'}>Skip for now</p>
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

function GoodreadsImport({ onSuccess }: { onSuccess?: () => void }) {
  const { state, importBooks } = useImportBooks()

  const [openSection, setOpenSection] = useState<GoodreadsSections>(null)

  return (
    <div className={collapsibleDivStyle}>
      <div
        className={
          'mt-1 mb-2 flex w-full flex-col gap-1 border-b border-primary/30 pb-2 sm:mt-4 sm:mb-4 sm:gap-2'
        }
      >
        <GoodreadsInstructions
          openSection={openSection}
          setOpenSection={setOpenSection}
          quirksNote={
            <p>
              Check your imported books in{' '}
              <span className={`text-emphasis`}>
                The{' '}
                <span className={'whitespace-nowrap'}>
                  Stacks
                  <span>
                    <BooksIcon weight={'bold'} className="ml-1 inline -translate-y-0.5" />
                  </span>
                </span>
              </span>{' '}
              page, where you can delete sneaky duplicates, fix a book's title and author, or add
              any missing reads.
            </p>
          }
        />
      </div>
      <ChooseFileButton
        isLoading={state.type === 'loading'}
        onFileSelect={(file) => {
          setOpenSection(null)
          void importBooks(file, 'goodreads', onSuccess)
        }}
        className={`my-1 self-center border-red-600/80 bg-button/95 shadow-md hover:bg-primary ${chooseFileButtonStyle}`}
      />
      <ImportOutcome state={state} />
    </div>
  )
}

function ManualEntry({ onSuccess }: { onSuccess?: () => void }) {
  const { state: addState, addBook } = useAddBook()

  return (
    <div className={`gap-2 sm:gap-3 ${collapsibleDivStyle}`}>
      <p>Add as many worthy contenders as you'd like below.</p>
      <p className={'mb-1 border-b border-primary/30 pb-3 sm:pb-4'}>
        Note that <span className={`text-emphasis`}>Rating</span> (1-10, decimals welcome) is
        optional, but encouraged. It provides an initial placement for the{' '}
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
      <div className={`mb-1 flex flex-col gap-2 border-b border-primary/30 pb-3 sm:gap-3 sm:pb-4`}>
        <CustomCSVInstructions />
      </div>
      <ChooseFileButton
        isLoading={state.type === 'loading'}
        onFileSelect={(file) => importBooks(file, 'custom', onSuccess)}
        className={`my-1 self-center border-red-600/80 bg-button/95 shadow-md hover:bg-primary ${chooseFileButtonStyle}`}
      />
      <ImportOutcome state={state} />
    </div>
  )
}

// --- PRIMITIVES

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
        <NavLink to={'/stacks'} className={`text-emphasis`}>
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
