import { NavLink } from 'react-router-dom'
import { UserButton } from '@clerk/react'

export function Nav() {
  function activeStyle({ isActive }: { isActive: boolean }): string {
    return isActive
      ? 'underline decoration-wavy decoration-2 underline-offset-4 decoration-accent/80'
      : 'opacity-90 hover:opacity-100 hover:scale-102 transition-all duration-200  hover:-translate-y-0.5'
  }

  return (
    <nav className="flex h-18 w-full items-center justify-end gap-8 px-6 py-4 align-middle font-zain text-[22px] font-extrabold tracking-wide text-primary/95">
      <NavLink to={'/brawl'} className={activeStyle}>
        Brawl Pit
      </NavLink>
      <NavLink to={'/leaderboard'} className={activeStyle}>
        Leaderboard
      </NavLink>
      <div className={`translate-y-0.5`}>
        <UserButton />
      </div>
    </nav>
  )
}
