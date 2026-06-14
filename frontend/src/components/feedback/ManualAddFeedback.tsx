import { CheckCircleIcon, ProhibitInsetIcon } from '@phosphor-icons/react'

import type { AddState } from '@/hooks/useAddBook'

const styles = {
  default: {
    p: `w-full md:self-end rounded-md md:rounded-lg bg-button px-4 pb-1.75 pt-2.25 text-lg md:w-fit md:text-xl md:brightness-110`,
    icon: 'mr-1.5 inline size-5 -translate-y-0.5 md:size-5.25',
  },
  compact: {
    p: `w-full font-bold rounded-md md:rounded-lg bg-button px-2.5 pb-1.75 pt-2.25 text-base md:text-lg md:px-3.5 md:pb-2.75 md:pt-3.25`,
    icon: 'mr-1.5 inline size-4.75 -translate-y-0.5 opacity-90 md:size-5 md:-translate-y-0.75',
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
  const pStyle = styles[variant].p
  const iconStyle = styles[variant].icon

  switch (addState.type) {
    case 'idle':
      return null

    case 'loading':
      return <p className={`font-bold text-text opacity-80 ${pStyle}`}>Updating the pit...</p>

    case 'error':
      return (
        <p className={`font-extrabold text-red-800 opacity-96 md:opacity-90 ${pStyle}`}>
          <ProhibitInsetIcon weight={'duotone'} className={iconStyle} />
          {addState.message}
        </p>
      )

    case 'success': {
      return (
        <p className={`text-text ${pStyle}`}>
          <CheckCircleIcon weight={'duotone'} className={`md:-translate-y-0.75 ${iconStyle}`} />
          Added: <span className={`font-calistoga md:ml-1`}>{addState.book.title}</span>, by{' '}
          <span className={`font-calistoga`}>{addState.book.author}</span>
        </p>
      )
    }
  }
}
