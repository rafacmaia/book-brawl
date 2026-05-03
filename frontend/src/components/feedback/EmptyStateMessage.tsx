import { CircleAlert } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export function EmptyStateMessage({ message }: { message: string }) {
  return (
    <div
      className={
        'flex w-full grow flex-col items-center justify-center gap-4 text-center font-zain text-4xl/12 font-extrabold tracking-wide text-pretty text-primary/85 sm:text-5xl/20 md:mb-12'
      }
    >
      <CircleAlert className={'mb-4 size-18 sm:size-20'} />
      <p>{message}</p>
      <p>
        <NavLink
          to={'/stacks'}
          className={`font-black text-primary/90 underline decoration-accent/80 decoration-4 underline-offset-4 transition-all duration-350 hover:text-5xl hover:text-primary hover:decoration-wavy hover:underline-offset-8 sm:hover:text-6xl`}
        >
          Feed the Stacks
        </NavLink>{' '}
        and try again.
      </p>
    </div>
  )
}
