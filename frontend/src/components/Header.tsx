import { UserButton } from '@clerk/react'
import { NavLink } from 'react-router-dom'

export default function Header() {
  function activeStyle({ isActive }: { isActive: boolean }): string {
    return isActive
      ? 'underline decoration-wavy decoration-2 underline-offset-4 decoration-accent/80'
      : 'opacity-90 active:opacity-100 active:scale-96 hover:sm:opacity-100 hover:sm:scale-102 transition-all duration-200 hover:sm:-translate-y-0.5'
  }

  return (
    <header className={'flex w-full px-1 py-3 sm:px-6 sm:py-3'}>
      <nav className="flex w-full items-center justify-around align-middle font-zain text-[20px] font-extrabold text-primary/95 sm:justify-end sm:gap-8 sm:tracking-wide">
        <NavLink to={'/brawl'} className={activeStyle}>
          Brawl Pit
        </NavLink>
        <NavLink to={'/leaderboard'} className={activeStyle}>
          Leaderboard
        </NavLink>
        <NavLink
          to={'/manage'}
          className={({ isActive }) => `${activeStyle({ isActive })} hidden sm:inline`}
        >
          Manage the Pit
        </NavLink>
        <NavLink
          to={'/manage'}
          className={({ isActive }) => `${activeStyle({ isActive })} sm:hidden`}
        >
          Manage Pit
        </NavLink>
        <div className={`translate-y-0.5 sm:translate-y-0.75`}>
          <UserButton />
        </div>
      </nav>
    </header>
  )
}
