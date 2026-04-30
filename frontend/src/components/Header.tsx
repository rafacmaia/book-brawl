import { UserButton } from '@clerk/react'
import { NavLink } from 'react-router-dom'
import { BooksIcon, SwordIcon, TrophyIcon } from '@phosphor-icons/react'
import WavyDivider from './WavyDivider.tsx'

export default function Header() {
  function activeStyle({ isActive }: { isActive: boolean }): string {
    return isActive
      ? 'underline scale-108 [@media(min-height:700px)]:max-md:scale-110 [@media(min-height:500px)]:max-md:translate-y-1.5 decoration-wavy decoration-2 underline-offset-4 '
      : 'opacity-90 active:opacity-100 active:scale-95 hover:md:opacity-100 hover:md:scale-105 hover:md:-translate-y-0.5'
  }

  const iconStyle =
    'max-md:mx-2 md:mr-2 inline md:size-5.5 size-6.75 relative top-[-1.5px] transition-all duration-200'

  return (
    <header className={'flex w-full px-1 py-3 md:px-6 md:py-3 [@media(max-height:500px)]:pb-0'}>
      <nav className="flex items-center justify-around align-middle font-zain text-lg font-extrabold text-primary/95 decoration-accent/80 max-md:w-full md:ml-auto md:justify-end md:gap-10 md:tracking-wide [@media(max-height:400px)]:scale-85 [@media(max-height:400px)]:justify-end [@media(max-height:400px)]:gap-10 [@media(max-height:400px)]:md:scale-100 [@media(max-height:500px)]:text-base [@media(min-height:700px)]:text-lg">
        <NavLink
          to={'/brawl'}
          className={({ isActive }) => `${activeStyle({ isActive })} transition-all duration-200`}
        >
          {({ isActive }) => (
            <>
              <span className={`hidden md:inline`}>
                <SwordIcon weight={isActive ? 'fill' : 'duotone'} className={iconStyle} />
                Brawl
              </span>
              <span className={`md:hidden`}>
                <SwordIcon weight={isActive ? 'fill' : 'duotone'} className={iconStyle} />
                {isActive && <WavyDivider amplitude={6} waveLength={21} stroke={6} />}
              </span>
            </>
          )}
        </NavLink>
        <NavLink
          to={'/leaderboard'}
          className={({ isActive }) => `${activeStyle({ isActive })} transition-all duration-200`}
        >
          {({ isActive }) => (
            <>
              <span className={`hidden md:inline`}>
                <TrophyIcon weight={isActive ? 'fill' : 'duotone'} className={iconStyle} />
                Leaderboard
              </span>
              <span className={`md:hidden`}>
                <TrophyIcon weight={isActive ? 'fill' : 'duotone'} className={iconStyle} />
                {isActive && <WavyDivider amplitude={6} waveLength={21} stroke={6} />}
              </span>
            </>
          )}
        </NavLink>
        <NavLink
          to={'/stacks'}
          className={({ isActive }) => `${activeStyle({ isActive })} transition-all duration-200`}
        >
          {({ isActive }) => (
            <>
              <span className={`hidden md:inline`}>
                <BooksIcon weight={isActive ? 'fill' : 'duotone'} className={iconStyle} />
                The Stacks
              </span>
              <span className={`md:hidden`}>
                <BooksIcon weight={isActive ? 'fill' : 'duotone'} className={iconStyle} />
                {isActive && <WavyDivider amplitude={6} waveLength={21} stroke={6} />}
              </span>
            </>
          )}
        </NavLink>
        <div className={`translate-y-0.75`}>
          <UserButton
            appearance={{
              elements: { avatarBox: '[@media(min-height:700px)]:size-7.25! size-6!' },
            }}
          />
        </div>
      </nav>
    </header>
  )
}
