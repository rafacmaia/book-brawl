import { CaretCircleRightIcon } from '@phosphor-icons/react'

export function ToggleIcon({
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
