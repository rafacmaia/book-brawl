import { SwordIcon } from '@phosphor-icons/react'

export function CustomCSVInstructions() {
  return (
    <>
      <p>
        If you track your books in Excel, Sheets, Notion, or anywhere with columns and rows, you can
        export it as a CSV file and throw it in here.
      </p>
      <p>
        You must have <span className={`text-emphasis`}>title</span> and{' '}
        <span className={`text-emphasis`}>author</span> columns.
      </p>
      <p>
        A <span className={`text-emphasis`}>rating</span> column (1-10, decimals welcome) is
        optional, but encouraged. It gives a starting placement for the{' '}
        <span className={`text-emphasis`}>
          Brawl Pit
          <span>
            <SwordIcon weight={'bold'} className="ml-1 inline -translate-y-0.5" />
          </span>
        </span>{' '}
        to put to the test.
      </p>
    </>
  )
}
