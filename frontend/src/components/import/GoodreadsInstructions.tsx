import { type ReactNode } from 'react'

import { Collapsible } from '@/components/ui/Collapsible'
import { ToggleIcon } from '@/components/ui/ToggleIcon'

const textEmphasisStyle = 'font-extrabold underline underline-offset-1 decoration-red-600/65'
const sectionToggleStyle = 'flex w-full cursor-pointer text-left items-center gap-1.5 sm:gap-2'
const h3Style = 'font-bold sm:font-extrabold underline decoration-accent/50 underline-offset-2'

export type GoodreadsSections = 'instructions' | 'quirks' | null

export function GoodreadsInstructions({
  openSection,
  setOpenSection,
  quirksNote,
}: {
  openSection: GoodreadsSections
  setOpenSection: (section: GoodreadsSections) => void
  quirksNote: ReactNode
}) {
  return (
    <>
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
                Select <span className={textEmphasisStyle}>Import and export</span> in the left-side
                menu.
              </li>
              <li>
                Under Export, click <span className={textEmphasisStyle}>Export Library</span> and
                wait for it to generate your file.
              </li>
              <li>
                Once ready, click the download link (likely named "
                <span className={textEmphasisStyle}>Your export from...</span>") and then upload it
                here!
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
              Goodreads often groups titles, subtitles, and series information together, which makes
              some titles awkwardly long, and duplicates harder to catch.
            </p>
            {quirksNote}
          </div>
        </Collapsible>
      </div>
    </>
  )
}
