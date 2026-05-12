import { type ReactNode, useState } from 'react'
import { BooksIcon, CaretCircleRightIcon, CaretRightIcon } from '@phosphor-icons/react'
import { useAddBook } from '../hooks/useAddBook'
import { ManualAddForm } from '../components/ManualAddForm'

export default function Onboarding() {
  const [showGoodreadsImport, setShowGoodreadsImport] = useState(false)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [showCustomCSV, setShowCustomCSV] = useState(false)

  const ToggleIcon = () => (
    <CaretCircleRightIcon size={20} weight="duotone" className="inline -translate-y-0.5" />
  )

  const sectionStyle = 'flex w-full flex-col items-center justify-center p-2 border-2 rounded-lg'
  const toggleOptionStyle = 'flex w-full items-center gap-2 cursor-pointer'
  const h2Style = 'text-xl font-bold tracking-wide'

  return (
    <main className="flex grow flex-col items-center justify-center gap-4 px-8 py-4 text-primary/95">
      {/* HEADING */}
      <div className="flex w-full flex-col gap-2 p-1 text-2xl font-bold tracking-wide">
        <BooksIcon size={64} weight="light" className="inline -translate-x-2.25 text-primary/90" />
        <h1 className={``}>
          To find the one book to rule them all, we must first add some contenders.
        </h1>
      </div>

      {/* GOODREADS IMPORT */}
      <section
        className={`${sectionStyle} ${showGoodreadsImport ? 'border-primary/80' : 'border-primary/25'}`}
      >
        <button
          onClick={() => {
            setShowGoodreadsImport(!showGoodreadsImport)
            setShowManualEntry(false)
            setShowCustomCSV(false)
          }}
          className={toggleOptionStyle}
        >
          <ToggleIcon />
          <h2 className={h2Style}>Import from Goodreads</h2>
        </button>
        <Collapsible isOpen={showGoodreadsImport}>
          <p
            className={
              'mt-2 border-t border-primary/25 p-2 pt-3 text-center text-lg font-bold tracking-wide'
            }
          >
            Coming soon!
          </p>
        </Collapsible>
      </section>

      {/* MANUAL ENTRY */}
      <section
        className={`${sectionStyle} ${showManualEntry ? 'border-primary/80' : 'border-primary/25'}`}
      >
        <button
          onClick={() => {
            setShowManualEntry(!showManualEntry)
            setShowGoodreadsImport(false)
            setShowCustomCSV(false)
          }}
          className={toggleOptionStyle}
          aria-expanded={showManualEntry}
        >
          <ToggleIcon />
          <h2 className={h2Style}>Manual Entry</h2>
        </button>
        <Collapsible isOpen={showManualEntry}>
          <ManualEntry />
        </Collapsible>
      </section>

      {/* CUSTOM CSV */}
      <section
        className={`${sectionStyle} ${showCustomCSV ? 'border-primary/80' : 'border-primary/25'}`}
      >
        <button
          onClick={() => {
            setShowCustomCSV(!showCustomCSV)
            setShowManualEntry(false)
            setShowGoodreadsImport(false)
          }}
          className={toggleOptionStyle}
        >
          <ToggleIcon />
          <h2 className={h2Style}>Custom CSV</h2>
        </button>
        <Collapsible isOpen={showCustomCSV}>
          <p
            className={
              'mt-2 border-t border-primary/25 p-2 pt-3 text-center text-lg font-bold tracking-wide'
            }
          >
            Coming soon!
          </p>
        </Collapsible>
      </section>

      {/* SKIP */}
      <button className="flex w-full cursor-pointer items-center justify-end gap-1 p-1">
        <p className={'text-lg font-bold tracking-wide'}>Skip for now</p>
        <CaretRightIcon size={20} weight="duotone" className="inline -translate-y-px" />
      </button>
    </main>
  )
}

// ====== SUBCOMPONENTS

function ManualEntry() {
  const { state: addState, addBook } = useAddBook()

  return (
    <div
      className={
        'mt-2 flex w-full flex-col items-start justify-center gap-2 border-t border-primary/25 p-2 pt-3 text-primary'
      }
    >
      <p className={'text-base tracking-wide'}>
        <span className={`font-extrabold underline decoration-accent/60`}>Rating</span> (1-10,
        decimals welcome) is optional, but encouraged. It provides an initial placement for the
        Brawl Pit to put to the test.
      </p>
      <p className={'mb-1 text-base tracking-wide'}>
        You can edit details, delete, and add more books at any point, by visiting{' '}
        <span className={`font-extrabold underline decoration-accent/60`}>
          The Stacks
          <span>
            <BooksIcon weight={'bold'} className="ml-1 inline -translate-y-0.5" />
          </span>
        </span>
        .
      </p>

      <ManualAddForm addState={addState} addBook={addBook} variant="compact" />
    </div>
  )
}

// ====== HELPERS

function Collapsible({ isOpen, children }: { isOpen: boolean; children: ReactNode }) {
  return (
    <div
      className={`grid w-full transition-[grid-template-rows] duration-500 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
    >
      <div className={'overflow-hidden'}>{children}</div>
    </div>
  )
}
