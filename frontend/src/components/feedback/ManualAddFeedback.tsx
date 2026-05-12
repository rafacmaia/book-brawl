import { CheckCircleIcon, ProhibitInsetIcon } from '@phosphor-icons/react'
import type { AddState } from '../../hooks/useAddBook'

const styles = {
  default: {
    p: `w-full md:self-end rounded-md md:rounded-lg bg-button px-4 pb-1.75 pt-2.25 text-lg md:w-fit md:px-6 md:text-xl md:brightness-110`,
    icon: 'mr-1.5 inline size-5 -translate-y-0.5 md:size-5.25',
  },
  compact: {
    p: `w-full md:self-end rounded-md md:rounded-lg bg-button px-4 pb-1.75 pt-2.25 text-base md:w-fit md:px-6 md:text-xl md:brightness-110`,
    icon: 'mr-1.5 inline size-4.75 -translate-y-0.5 md:size-5',
  },
}

// Displays add-feedback for the manual entry form: loading, error, or success.
export default function ManualAddFeedback({
  addState,
  variant = 'default',
}: {
  addState: AddState
  variant?: 'default' | 'compact'
}) {
  const messageStyle = styles[variant].p
  const iconStyle = styles[variant].icon

  switch (addState.type) {
    case 'idle':
      return null

    case 'loading':
      return <p className={`font-bold text-text opacity-80 ${messageStyle}`}>Updating the pit...</p>

    case 'error':
      return (
        <p className={`font-extrabold text-red-800 opacity-96 md:opacity-90 ${messageStyle}`}>
          <ProhibitInsetIcon weight={'duotone'} className={iconStyle} />
          {addState.message}
        </p>
      )

    case 'success': {
      const bookDataStyle = 'font-bold decoration-accent/70 underline-offset-3 md:underline'
      return (
        <p className={`text-text ${messageStyle}`}>
          <CheckCircleIcon weight={'duotone'} className={`md:-translate-y-0.75 ${iconStyle}`} />
          Added: <span className={`md:ml-1 ${bookDataStyle}`}>{addState.book.title}</span>, by{' '}
          <span className={bookDataStyle}>{addState.book.author}</span>
        </p>
      )
    }
  }
}
