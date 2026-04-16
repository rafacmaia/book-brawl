import type { ReactNode } from 'react'

export default function PageHeading({ title }: { title: string | ReactNode }) {
  const wavyUnderline =
    'underline decoration-accent/80 decoration-wavy decoration-4 underline-offset-12'

  return (
    <h1
      className={`text-center font-calistoga text-[42px] font-extrabold tracking-wider text-primary/95 drop-shadow-xs sm:text-6xl sm:tracking-widest ${wavyUnderline}`}
    >
      {title}
    </h1>
  )
}
