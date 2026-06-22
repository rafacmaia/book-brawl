import type { ReactNode } from 'react'

export function Collapsible({ isOpen, children }: { isOpen: boolean; children: ReactNode }) {
  return (
    <div
      className={`grid w-full transition-[grid-template-rows] duration-600 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
    >
      <div className={`overflow-hidden`}>{children}</div>
    </div>
  )
}
