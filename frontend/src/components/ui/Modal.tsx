import { XCircleIcon } from '@phosphor-icons/react'
import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

export function Modal({
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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 py-4 sm:items-center"
    >
      <div
        className={`relative my-auto flex max-h-[calc(100vh-2rem)] w-[90%] flex-col gap-4 overflow-y-auto rounded-lg border border-y-8 bg-button/97 p-4 font-zain text-text shadow-2xl sm:w-lg sm:gap-4 sm:rounded-md sm:border-t-8 sm:border-b-8 sm:p-8 ${borderColor}`}
      >
        <button
          onClick={onClose}
          disabled={isActive}
          aria-label="Close modal"
          className="absolute top-2 right-2 cursor-pointer text-red-800/80 transition-all hover:scale-112 active:scale-95 sm:top-3 sm:right-3"
        >
          <XCircleIcon weight={'duotone'} className="size-6.25 sm:size-7" />
        </button>
        <h2 className={`font-calistoga text-2xl font-bold tracking-wide sm:text-3xl`}>{heading}</h2>
        {children}
      </div>
    </div>
  )
}

export function ModalError({ error }: { error: string }) {
  return (
    <p
      className={`w-full self-center rounded-md bg-red-800/90 px-4 py-3 text-center text-base font-extrabold text-pretty text-primary opacity-95 sm:rounded-lg sm:px-4 sm:pb-2.75 sm:text-lg sm:text-primary sm:opacity-90 sm:brightness-110`}
    >
      <TriangleAlert strokeWidth={2.25} className={'inline size-4 sm:size-4.5'} />
      <br />
      {error}
    </p>
  )
}
