import { useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import { ApiError, apiFetch } from '../api'
import Placeholder from '../components/Placeholder'
import { CircleAlert } from 'lucide-react'
import { NavLink } from 'react-router-dom'

interface Book {
  id: number
  title: string
  author: string
}

interface Match {
  book_a: Book
  book_b: Book
}

function BookButton({
  book,
  onClick,
  isSelected,
}: {
  book: Book
  onClick: () => void
  isSelected: boolean
}) {
  const title = book.title.trim()
  const author = book.author.trim()

  const longTitle = title.length >= 37
  const veryLongTitle = title.length >= 69
  const longAuthor = author.length >= 30

  const italic = /\b(?:anonymous|various)\b/i.test(author)

  let cardStyle: string, titleStyle: string, authorStyle: string

  if ((longTitle && longAuthor) || veryLongTitle) {
    cardStyle = 'gap-1 px-4 [@media(min-height:600px)]:px-5 sm:gap-4 sm:px-7 sm:py-3'
    titleStyle =
      'text-[1.4rem]/8 [@media(min-height:700px)]:text-[2rem]/10 [@media(min-height:700px)]:sm:text-[2.3rem]/13'
    authorStyle =
      'text-[1.2rem] [@media(min-height:700px)]:text-[1.375rem]/7 [@media(min-height:700px)]:sm:text-[1.6rem]/10'
  } else if (longTitle || longAuthor) {
    cardStyle =
      'gap-1 px-6 [@media(min-height:700px)]:gap-3 [@media(min-height:700px)]:sm:gap-4 [@media(min-height:700px)]:sm:px-8 sm:py-3'
    titleStyle = longTitle
      ? 'text-[1.4rem]/8 [@media(min-height:600px)]:text-[1.7rem]/8 [@media(min-height:700px)]:text-[2rem]/11 [@media(min-height:700px)]:sm:text-[2.265rem]/14'
      : 'text-[1.6rem]/8 [@media(min-height:600px)]:text-[1.9rem] [@media(min-height:700px)]:text-[2.125rem]/11 [@media(min-height:700px)]:sm:text-[2.75rem]/14'
    authorStyle = longAuthor
      ? 'text-[1.2rem]/8 [@media(min-height:700px)]:text-[1.35rem]/8 [@media(min-height:700px)]:sm:text-[1.6rem]/10'
      : 'text-[1.2rem]/8 [@media(min-height:600px)]:text-[1.35rem]/8 [@media(min-height:700px)]:text-[1.5rem] [@media(min-height:700px)]:sm:text-[1.8rem]'
  } else {
    cardStyle =
      'gap-1 px-6 [@media(min-height:600px)]:gap-1.75 [@media(min-height:700px)]:gap-4 [@media(min-height:700px)]:sm:gap-6 [@media(min-height:700px)]:sm:py-4'
    titleStyle =
      'text-[1.6rem]/8 [@media(min-height:600px)]:text-[1.9rem]/9 [@media(min-height:700px)]:text-[2.2rem]/11 [@media(min-height:700px)]:sm:text-[2.75rem]/16'
    authorStyle =
      'text-[1.2rem] [@media(min-height:600px)]:text-[1.35rem]/8 [@media(min-height:700px)]:text-[1.5rem] [@media(min-height:700px)]:sm:text-[1.875rem]'
  }

  const selectedStyling = isSelected
    ? 'scale-85 -translate-y-2 border-primary/80 bg-background text-primary shadow-2xl'
    : 'text-text border-accent/80 bg-linear-to-b from-[oklch(0.860_0.152_97.399)] to-[oklch(0.815_0.152_97.399)] shadow-lg'
  const hoverStyling =
    'md:hover:-translate-y-2 md:hover:scale-[1.02] md:hover:border-primary/80 md:hover:bg-linear-to-b md:hover:from-sky-800 md:hover:to-sky-900 md:hover:text-primary md:hover:shadow-2xl md:hover:brightness-105 max-md:active:scale-95 max-md:active:border-primary/80 max-md:active:bg-linear-to-b max-md:active:from-sky-800 max-md:active:to-sky-900 max-md:active:text-primary max-md:active:shadow-2xl'

  return (
    <button
      style={{
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.20)',
      }}
      className={`flex w-[95%] flex-1 basis-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-b-8 py-2 font-calistoga shadow-xl transition-all duration-250 md:border-b-8 lg:h-80 lg:flex-none lg:rounded-xl xl:h-72 [@media(min-height:700px)]:w-11/12 [@media(min-height:700px)]:lg:w-116 [@media(min-height:700px)]:xl:w-134 ${hoverStyling} ${cardStyle} ${selectedStyling}`}
      onClick={onClick}
    >
      <p
        className={`line-clamp-3 w-full p-1 font-medium text-balance wrap-break-word lg:line-clamp-3 [@media(min-height:600px)]:line-clamp-4 ${titleStyle}`}
      >
        {title}
      </p>
      <p
        className={`line-clamp-2 w-full font-zain font-light text-pretty wrap-break-word opacity-85 ${authorStyle}`}
      >
        by <span className={italic ? 'italic' : ''}>{author}</span>
      </p>
    </button>
  )
}

export default function BrawlPit() {
  const { getToken } = useAuth()

  const [match, setMatch] = useState<Match | null>(null)
  const [nextMatch, setNextMatch] = useState<Match | null>(null)
  const [matchCount, setMatchCount] = useState<number>(1)
  const [selectedBook, setSelectedBook] = useState<number | null>(null)

  const [emptyPit, setEmptyPit] = useState<boolean>(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transition, setTransition] = useState(false)

  useEffect(() => {
    void (async () => {
      const token = await getToken()
      const [firstMatch, secondMatch] = await Promise.all([fetchMatch(token!), fetchMatch(token!)])

      setMatch(firstMatch ?? null)
      setLoading(false)
      requestAnimationFrame(() => setTransition(true))
      setNextMatch(secondMatch ?? null)
    })()
  }, [])

  async function fetchMatch(token: string) {
    try {
      const response = await apiFetch('/brawl', token!)
      return await response.json()
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setEmptyPit(true)
      } else {
        setError("You shouldn't be here! Trying refreshing!")
      }
    }
  }

  async function handleChoice(winnerId: number, loserId: number) {
    setError(null)

    const isMobile = window.matchMedia('(max-width: 639px)').matches

    if (isMobile) {
      setSelectedBook(winnerId)
      await new Promise((resolve) => setTimeout(resolve, 125))
      setTransition(false)
      await new Promise((resolve) => setTimeout(resolve, 275))
    }

    if (nextMatch) {
      if (!isMobile) {
        setTransition(false)
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
      setMatchCount((prevCount) => prevCount + 1)
      setMatch(nextMatch)

      await new Promise((resolve) => setTimeout(resolve, 50))
      setTransition(true)
      setSelectedBook(null)

      setNextMatch(null)
    }

    try {
      const token = await getToken()

      const [_, next] = await Promise.all([
        apiFetch('/brawl/resolve', token!, {
          method: 'POST',
          body: JSON.stringify({ winner_id: winnerId, loser_id: loserId }),
        }),
        fetchMatch(token!),
      ])

      setNextMatch(next)
    } catch (error) {
      setError('Something went wrong. Please try again.')
    }
  }

  const wavyUnderline =
    'underline decoration-accent/80 decoration-wavy decoration-5 lg:decoration-8 underline-offset-46 md:underline-offset-2 lg:underline-offset-42'

  return (
    <main className="relative flex grow flex-col items-center px-4 text-primary/95">
      {loading ? (
        <Placeholder message={'Loading...'} />
      ) : error ? (
        <Placeholder message={error} />
      ) : emptyPit ? (
        <div
          className={
            'mb-12 flex grow flex-col items-center justify-center gap-2 text-center font-zain text-4xl/12 font-extrabold tracking-wide text-pretty text-primary/85 sm:text-5xl/20'
          }
        >
          <CircleAlert className={'mb-6 size-18 sm:size-20'} />
          <p className={``}>Not enough books to brawl!</p>
          <p>
            <NavLink
              to={'/manage'}
              className={`font-black text-primary/90 underline decoration-accent/80 decoration-4 underline-offset-4 transition-all duration-350 hover:text-5xl hover:text-primary hover:decoration-wavy hover:underline-offset-8 sm:hover:text-6xl`}
            >
              Feed the Pit
            </NavLink>{' '}
            and try again.
          </p>
        </div>
      ) : (
        match && (
          <>
            <h1
              className={`z-100 mb-1 flex-none text-center font-calistoga text-[1.4rem] tracking-wide text-balance text-primary/95 drop-shadow-md [@media(min-height:600px)]:text-[2.5rem]/12 [@media(min-height:600px)]:font-extrabold [@media(min-height:600px)]:tracking-wide [@media(min-height:700px)]:mt-4 [@media(min-height:700px)]:mb-2 [@media(min-height:700px)]:text-5xl/14 [@media(min-height:700px)]:md:mt-12 [@media(min-height:700px)]:lg:mt-24 [@media(min-height:700px)]:lg:text-7xl`}
            >
              Which means more to{' '}
              <span
                className={`underline decoration-accent/60 decoration-3 underline-offset-3 [@media(min-height:700px)]:no-underline`}
              >
                you
              </span>
              ?
            </h1>
            <h1
              className={`absolute z-0 mt-24 hidden text-center font-calistoga text-5xl font-extrabold tracking-wide text-background/0 lg:block lg:text-7xl ${wavyUnderline}`}
            >
              ===============
            </h1>
            <div className={'flex w-[97%] items-center justify-center md:w-19/20 lg:hidden'}>
              <hr className="my-0 h-px w-full text-button opacity-70" />
              <p
                className={`${transition ? 'opacity-80' : 'opacity-0'} mx-4 font-gaegu text-lg font-bold tracking-widest transition-opacity duration-250 ease-in-out`}
              >
                {matchCount}
              </p>
              <hr className="my-0 h-px w-full text-button opacity-70" />
            </div>
            <div
              className={`${transition ? 'translate-y-0 opacity-100' : 'pointer-events-none opacity-0 max-md:scale-96 sm:translate-y-3'} mt-2 mb-1 flex w-full grow flex-col items-center justify-center gap-3 transition-all duration-275 ease-in-out [@media(min-height:700px)]:mt-3 [@media(min-height:700px)]:mb-3 [@media(min-height:700px)]:gap-6 [@media(min-height:700px)]:lg:my-0 [@media(min-height:700px)]:lg:flex-row [@media(min-height:700px)]:lg:gap-12 [@media(min-height:700px)]:xl:gap-27`}
            >
              <BookButton
                book={match.book_a}
                onClick={() => handleChoice(match.book_a.id, match.book_b.id)}
                isSelected={selectedBook === match.book_a.id}
              />
              <BookButton
                book={match.book_b}
                onClick={() => handleChoice(match.book_b.id, match.book_a.id)}
                isSelected={selectedBook === match.book_b.id}
              />
            </div>
            <div
              className={
                'absolute -bottom-2 left-1/2 hidden w-full -translate-x-1/2 items-center justify-center lg:flex'
              }
            >
              <p
                className={`${transition ? 'opacity-75' : 'opacity-0'} mx-4 font-gaegu text-xl font-black tracking-widest transition-opacity duration-250 ease-in-out`}
              >
                {matchCount}
              </p>
            </div>
          </>
        )
      )}
    </main>
  )
}
