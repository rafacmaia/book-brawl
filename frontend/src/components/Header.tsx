import { UserButton } from '@clerk/react'
import { NavLink } from 'react-router-dom'

export default function Header() {
  function activeStyle({ isActive }: { isActive: boolean }): string {
    return isActive
      ? 'underline decoration-wavy decoration-2 underline-offset-4 decoration-accent/80'
      : 'opacity-90 hover:opacity-100 hover:scale-102 transition-all duration-200  hover:-translate-y-0.5'
  }

  return (
    <header className={'flex w-full px-6 py-3'}>
      <nav className="ml-auto flex items-center gap-8 align-middle font-zain text-[20px] font-extrabold tracking-wide text-primary/95">
        <NavLink to={'/brawl'} className={activeStyle}>
          Brawl Pit
        </NavLink>
        <NavLink to={'/leaderboard'} className={activeStyle}>
          Leaderboard
        </NavLink>
        <NavLink to={'/manage'} className={activeStyle}>
          Manage the Pit
        </NavLink>
        <div className={`translate-y-1`}>
          <UserButton />
        </div>
      </nav>
    </header>
  )
}
