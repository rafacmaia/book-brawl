import { CheckCircleIcon, SkipForwardCircleIcon, XCircleIcon } from '@phosphor-icons/react'

import type { ImportState } from '@/hooks/useImportBooks'

const styles = {
  default: {
    container: 'mt-1 px-2.5',
    message: `text-base font-extrabold tracking-wide md:text-lg`,
    error: 'text-red-700',
    icon: 'mr-0.5 inline size-4.5 -translate-y-0.5 opacity-90 md:size-5.75',
  },
  compact: {
    container: 'rounded-lg bg-button px-3 pb-1.75 pt-2.25 mt-1 md:pb-2.25 md:pt-2.75',
    message: `text-base font-bold tracking-wide md:text-lg`,
    error: 'text-red-700/90 md:text-text',
    icon: 'mr-0.5 inline size-4.75 -translate-y-0.5 opacity-90 md:mr-0.75 md:-translate-y-0.75',
  },
}

export function ImportFeedback({
  state,
  variant = 'default',
}: {
  state: ImportState
  variant?: 'default' | 'compact'
}) {
  const containerStyle = styles[variant].container
  const messageStyle = styles[variant].message
  const errorStyle = styles[variant].error
  const iconStyle = styles[variant].icon

  switch (state.type) {
    case 'idle':
    case 'loading':
      return null

    case 'error':
      return (
        <p className={`font-bold ${errorStyle} ${containerStyle} ${messageStyle}`}>
          {state.message}
        </p>
      )

    case 'success': {
      const { imported, invalid, duplicates, interrupted } = state.result

      let skippedMessage = ''
      if (invalid + duplicates > 0) {
        if (duplicates === 0) {
          skippedMessage = `Skipped ${invalid} ${invalid > 1 ? 'books' : 'book'} with missing title or author.`
        } else if (invalid === 0) {
          skippedMessage = `Skipped ${duplicates} duplicate ${duplicates > 1 ? 'titles' : 'title'}.`
        } else {
          skippedMessage = `Skipped ${invalid + duplicates} books: ${invalid} with missing title or author, and ${duplicates} duplicate ${duplicates > 1 ? 'titles' : 'title'}.`
        }
      }

      return (
        <div className={`flex flex-col gap-2 ${containerStyle} ${messageStyle}`}>
          {imported > 0 ? ( // Notify how many books were imported (if any)
            <p className="text-text">
              <CheckCircleIcon weight={'fill'} aria-hidden={'true'} className={iconStyle} />{' '}
              Imported{' '}
              <span className="underline decoration-accent underline-offset-2">{imported}</span>{' '}
              {imported === 1 ? 'book' : 'books'}!
            </p>
          ) : (
            // Notify if no books were imported
            <p className={errorStyle}>
              <XCircleIcon
                weight={'fill'}
                aria-hidden={'true'}
                className={`text-red-700 ${iconStyle}`}
              />{' '}
              No books imported. Check file and try again.
            </p>
          )}

          {invalid + duplicates > 0 && !interrupted && (
            // Check for and notify if there were any skipped rows
            <p className={`text-text`}>
              <SkipForwardCircleIcon weight={'fill'} aria-hidden={'true'} className={iconStyle} />{' '}
              {skippedMessage}
            </p>
          )}
          {interrupted && ( // Notify if import was incomplete.
            <p className={errorStyle}>
              <XCircleIcon weight={'fill'} aria-hidden={'true'} className={iconStyle} /> Limit
              reached — not all books were imported. Remove some books and try again.
            </p>
          )}
        </div>
      )
    }
  }
}
