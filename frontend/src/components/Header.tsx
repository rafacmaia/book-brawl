import { UserButton } from '@clerk/react'
import { NavLink } from 'react-router-dom'

export default function Header() {
  function activeStyle({ isActive }: { isActive: boolean }): string {
    return isActive
      ? 'underline max-md:scale-112 max-md:translate-y-0.5 decoration-wavy decoration-2 underline-offset-4 '
      : 'opacity-90 active:opacity-100 active:scale-96 hover:sm:opacity-100 hover:sm:scale-102 hover:sm:-translate-y-0.5'
  }

  return (
    <header className={'flex w-full px-1 py-3 sm:px-6 sm:py-3'}>
      <nav className="flex w-full items-center justify-around align-middle font-zain text-[18px] font-extrabold text-primary/95 decoration-accent/80 sm:text-[20px] sm:tracking-wide md:justify-end md:gap-8">
        <NavLink
          to={'/brawl'}
          className={({ isActive }) => `${activeStyle({ isActive })} transition-all duration-200`}
        >
          Brawl Pit
        </NavLink>
        <NavLink
          to={'/leaderboard'}
          className={({ isActive }) => `${activeStyle({ isActive })} transition-all duration-200`}
        >
          Leaderboard
        </NavLink>
        <NavLink
          to={'/manage'}
          className={({ isActive }) => `${activeStyle({ isActive })} transition-all duration-200`}
        >
          <span className={`hidden sm:inline`}>Manage the Pit</span>
          <span className="sm:hidden">Manage Pit</span>
        </NavLink>
        <div className={`translate-y-0.5 sm:translate-y-0.75`}>
          <UserButton />
        </div>
      </nav>
    </header>
  )
}
