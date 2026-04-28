import { UserButton } from '@clerk/react'
import { NavLink } from 'react-router-dom'

export default function Header() {
  function activeStyle({ isActive }: { isActive: boolean }): string {
    return isActive
      ? 'underline scale-108 [@media(min-height:700px)]:max-md:scale-110 max-md:translate-y-0.5 decoration-wavy decoration-2 underline-offset-4 '
      : 'opacity-90 active:opacity-100 active:scale-96 hover:md:opacity-100 hover:md:scale-104 hover:md:-translate-y-0.5'
  }

  return (
    <header className={'flex w-full px-1 py-3 md:px-6 md:py-3 [@media(max-height:500px)]:pb-0'}>
      <nav className="flex items-center justify-around align-middle font-zain text-lg font-extrabold text-primary/95 decoration-accent/80 max-md:w-full md:ml-auto md:justify-end md:gap-10 md:tracking-wide [@media(max-height:500px)]:text-base [@media(min-height:700px)]:text-lg">
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
        <div className={`translate-y-0.75`}>
          <UserButton
            appearance={{ elements: { avatarBox: '[@media(min-height:700px)]:size-7! size-6!' } }}
          />
        </div>
      </nav>
    </header>
  )
}
