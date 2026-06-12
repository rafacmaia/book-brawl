import { useAuth } from '@clerk/react'
import { useEffect, useEffectEvent, useState } from 'react'
import { ApiError, apiFetch } from '../api'
import PlaceholderMessaging from '../components/feedback/PlaceholderMessaging'
import { EmptyStateMessage } from '../components/feedback/EmptyStateMessage'
import { Swords } from 'lucide-react'
import { BookIcon } from '@phosphor-icons/react'

interface Book {
  id: number
  title: string
  author: string
}

interface Match {
  book_a: Book
  book_b: Book
}

// Wavy underline is used as a divider between prompt and book cards on desktop viewports.
const wavyDividerStyle =
  'underline decoration-accent/80 decoration-wavy decoration-5 lg:decoration-8 underline-offset-46 md:underline-offset-2 lg:underline-offset-42'

// Delay function to help coordinate match transitions.
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function BrawlPit() {
  const { getToken } = useAuth()

  // We prefetch the next match while the user is deciding on the current one,
  // so swapping is instant.
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null)
  const [nextMatch, setNextMatch] = useState<Match | null>(null)
  const [matchCount, setMatchCount] = useState<number>(1)
  const [selectedBook, setSelectedBook] = useState<number | null>(null)
  const [matchTransition, setMatchTransition] = useState(false)

  const [emptyPit, setEmptyPit] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Coordinates triggering match transitions on mobile and desktop.
  async function playMatchTransition(winnerId: number) {
    const isCompactViewport =
      window.matchMedia('(max-width: 639px)').matches ||
      window.matchMedia('(max-height: 500px)').matches // catches mobile landscape mode

    // Handles book card transitions on mobile, where hover and active states act differently,
    // so we have to be more explicit on giving user feedback on their selected book and to
    // trigger transition between matches.
    if (isCompactViewport) {
      setSelectedBook(winnerId) // triggers "selected book" effect
      await delay(125)
      setMatchTransition(false) // triggers match transition: fade out/in
      await delay(250)
    } else {
      // Desktop: triggers fade-in-and-out of book cards.
      setMatchTransition(false)
      await delay(300)
    }
  }

  // Completes a match transition.
  async function finishTransition() {
    await delay(50)
    setMatchTransition(true)
    setSelectedBook(null)
  }

  async function fetchMatch(token: string): Promise<Match> {
    const response = await apiFetch('/brawl', token)
    return await response.json()
  }

  // To avoid immediate book repeats, fetchNextMatch retries up to 3 times to fetch a match
  // that does not repeat a book from the previous match.
  async function fetchNextMatch(token: string, currentMatch: Match | null) {
    let candidate = await fetchMatch(token)
    if (!currentMatch) return candidate

    for (let attempt = 0; attempt < 2; attempt++) {
      const repeatsBook =
        candidate.book_a.id === currentMatch.book_a.id ||
        candidate.book_a.id === currentMatch.book_b.id ||
        candidate.book_b.id === currentMatch.book_a.id ||
        candidate.book_b.id === currentMatch.book_b.id

      if (!repeatsBook) return candidate

      candidate = await fetchMatch(token)
    }

    // After 3 attempts to avoid repeats, trust the matchmaker and return the last candidate.
    return candidate
  }

  // Resolves a completed match
  async function resolveMatch(token: string, winnerId: number, loserId: number): Promise<void> {
    try {
      await apiFetch('/brawl/resolve', token!, {
        method: 'POST',
        body: JSON.stringify({ winner_id: winnerId, loser_id: loserId }),
      })
    } catch (err) {
      console.error('Failed to resolve match:', err)
    }
  }

  // Loads the first two matches to start the game, checking if there are enough books to play.
  const loadInitialMatches = useEffectEvent(async () => {
    let token: string | null = null
    let firstMatch: Match | null = null

    try {
      token = await getToken()
      firstMatch = await fetchMatch(token!)
      setCurrentMatch(firstMatch)
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setEmptyPit(true)
      } else {
        console.error('Failed to load initial match: ', err)
        setError("Wow, this shouldn't happen! Try refreshing!")
      }
    } finally {
      setLoading(false)
    }

    if (!firstMatch) return
    requestAnimationFrame(() => setMatchTransition(true)) // loads the first match

    try {
      setNextMatch(await fetchNextMatch(token!, firstMatch))
    } catch (err) {
      // Logs to console but does not stop the game since user already has an ongoing match.
      console.error('Failed to fetch second match: ', err)
    }
  })

  useEffect(() => {
    void loadInitialMatches()
  }, [])

  async function handleChoice(winnerId: number, loserId: number) {
    setError(null)

    let token: string | null = null
    let newCurrentMatch: Match | null = null

    // Load prefetched match if available, otherwise fetch a new one.
    if (nextMatch) {
      newCurrentMatch = nextMatch
    } else {
      try {
        token = await getToken()
        newCurrentMatch = await fetchNextMatch(token!, currentMatch)
      } catch (err) {
        console.error('Failed to fetch match:', err)

        if (token) void resolveMatch(token, winnerId, loserId) // silently resolve previous match

        setError('Something went wrong. Please refresh the page and try again.')
        return
      }
    }

    await playMatchTransition(winnerId)
    setMatchCount((prevCount) => prevCount + 1)
    setCurrentMatch(newCurrentMatch)
    setNextMatch(null)
    await finishTransition()

    // While the user is already seeing the next match, resolve the completed match and prefetch
    // the next one.
    try {
      if (!token) token = await getToken()

      void resolveMatch(token!, winnerId, loserId) // resolve previous match

      try {
        setNextMatch(await fetchNextMatch(token!, newCurrentMatch))
      } catch (err) {
        console.error('Failed to prefetch match:', err)
        setNextMatch(null)
      }
    } catch (err) {
      console.error('handleChoice failed: ', err)
      setError('Something went wrong. Please refresh the page and try again.')
    }
  }

  return (
    <main className="relative flex grow flex-col items-center px-4 text-primary/95">
      {loading ? (
        <div
          className={
            'flex w-full grow animate-pulse flex-col items-center justify-center gap-4 text-center font-zain text-[2.5rem]/12 font-extrabold tracking-wider text-balance text-primary/85 sm:text-5xl/20 md:mb-12 md:w-2xl'
          }
        >
          <div className="mb-4 flex items-center justify-center gap-4 md:gap-6">
            <BookIcon weight={'duotone'} className={'size-12 sm:size-16'} />
            <Swords className={'size-14 sm:size-20'} />
            <BookIcon weight={'duotone'} className={'size-12 -scale-x-100 sm:size-16'} />
          </div>
          <p>Summoning contenders...</p>
        </div>
      ) : error ? (
        <PlaceholderMessaging message={error} />
      ) : emptyPit ? (
        <EmptyStateMessage message={'No books to brawl!'} />
      ) : (
        currentMatch && (
          <>
            <h1
              className={`z-100 mt-2.75 flex-none text-center font-calistoga text-[1.4rem] tracking-wide text-balance text-primary/95 drop-shadow-md [@media(max-height:500px)]:w-[94%] [@media(max-height:500px)]:text-left [@media(max-height:500px)]:text-[1.6rem]/7 [@media(min-height:500px)]:mt-1.25 [@media(min-height:500px)]:mb-0.5 [@media(min-height:600px)]:text-[2.5rem]/12 [@media(min-height:600px)]:font-extrabold [@media(min-height:600px)]:tracking-wide [@media(min-height:700px)]:mt-4 [@media(min-height:700px)]:mb-2 [@media(min-height:700px)]:text-5xl/14 [@media(min-height:700px)]:md:mt-12 [@media(min-height:700px)]:lg:mt-24 [@media(min-height:700px)]:lg:text-7xl`}
            >
              Which means more to{' '}
              <span
                className={`decoration-accent/65 decoration-3 underline-offset-3 [@media(max-height:700px)]:underline`}
              >
                you
              </span>
              ?
            </h1>
            {/*
              Wavy divider hack: using an invisible text whose only job is to anchor a wavy
              underline used as a divider between the prompt and the book cards on desktop.
              Cheaper and crisper than rendering an SVG.
            */}
            <div
              aria-hidden="true"
              className={`absolute z-0 mt-24 hidden text-center font-calistoga text-5xl font-extrabold tracking-wide text-background/0 lg:text-7xl [@media(min-height:700px)]:lg:block ${wavyDividerStyle}`}
            >
              ===============
            </div>
            <div // Mobile match count and divider
              className={
                'flex w-[97%] items-center justify-center md:w-19/20 lg:hidden [@media(max-height:500px)]:opacity-90'
              }
            >
              <hr className="my-0 h-px w-full text-button opacity-70" />
              <p
                className={`${matchTransition ? 'opacity-80' : 'opacity-0'} mx-4 font-gaegu text-lg font-bold tracking-widest transition-opacity duration-250 ease-in-out [@media(max-height:500px)]:mx-3 [@media(max-height:500px)]:text-base`}
              >
                {matchCount}
              </p>
              <hr className="my-0 h-px w-full text-button opacity-70 [@media(max-height:500px)]:w-6" />
            </div>
            <div // Book cards container
              className={`${matchTransition ? 'translate-y-0 opacity-100' : 'pointer-events-none opacity-0 max-md:scale-96 sm:translate-y-3'} my-1 flex w-full grow flex-col items-center justify-center gap-0.5 transition-all duration-275 ease-in-out md:mb-3 [@media(min-height:350px)]:gap-1.5 [@media(min-height:500px)]:mt-1.5 [@media(min-height:500px)]:gap-3 [@media(min-height:700px)]:mt-3 [@media(min-height:700px)]:mb-3 [@media(min-height:700px)]:gap-6 [@media(min-height:700px)]:md:mb-1 [@media(min-height:700px)]:lg:my-0 [@media(min-height:700px)]:lg:flex-row [@media(min-height:700px)]:lg:gap-12 [@media(min-height:700px)]:xl:gap-27`}
            >
              <BookCard
                book={currentMatch.book_a}
                onClick={() => handleChoice(currentMatch.book_a.id, currentMatch.book_b.id)}
                isSelected={selectedBook === currentMatch.book_a.id}
                disabled={!nextMatch}
              />
              <BookCard
                book={currentMatch.book_b}
                onClick={() => handleChoice(currentMatch.book_b.id, currentMatch.book_a.id)}
                isSelected={selectedBook === currentMatch.book_b.id}
                disabled={!nextMatch}
              />
            </div>
            <div // Desktop match count
              className={
                'absolute -bottom-2 left-1/2 hidden w-full -translate-x-1/2 items-center justify-center [@media(min-height:700px)]:lg:flex'
              }
            >
              <p
                className={`${matchTransition ? 'opacity-75' : 'opacity-0'} mx-4 font-gaegu text-xl font-black tracking-widest transition-opacity duration-250 ease-in-out`}
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

function BookCard({
  book,
  onClick,
  isSelected,
  disabled,
}: {
  book: Book
  onClick: () => void
  isSelected: boolean
  disabled: boolean
}) {
  const title = book.title.trim()
  const author = book.author.trim()

  // Italicize 'anonymous' and 'various' author fields
  const italic = /\b(?:anonymous|various)\b/i.test(author)

  // Identify long titles and authors for better formatting.
  // Threshold values derived from trial and error, could be more precisely fine-tuned.
  const longTitle = title.length >= 37
  const veryLongTitle = title.length >= 69
  const longAuthor = author.length >= 30

  const regularCardStyle =
    'gap-1 px-5 [@media(min-height:600px)]:gap-1.75 [@media(min-height:700px)]:px-8 [@media(min-height:700px)]:gap-4 [@media(min-height:700px)]:sm:gap-6 [@media(min-height:700px)]:sm:py-4'
  const regularTitleStyle =
    '[@media(min-height:350px)]:text-[1.6rem]/8  [@media(min-height:600px)]:text-[1.85rem]/10 [@media(min-height:700px)]:text-[2.125rem]/11 [@media(min-height:700px)]:sm:text-[2.75rem]/15'
  const regularAuthorStyle =
    '[@media(min-height:350px)]:text-[1.25rem]/6 [@media(min-height:600px)]:text-[1.35rem]/7 [@media(min-height:700px)]:text-[1.5rem] [@media(min-height:700px)]:sm:text-[1.875rem]'

  const tightCardStyle =
    'gap-1 px-5 [@media(min-height:700px)]:gap-3 [@media(min-height:700px)]:sm:gap-4 [@media(min-height:700px)]:px-6 [@media(min-height:700px)]:sm:px-8 sm:py-3'
  const tightTitleStyle =
    '[@media(min-height:350px)]:text-[1.6rem]/8  [@media(min-height:600px)]:text-[1.65rem]/8 [@media(min-height:700px)]:text-[2rem]/10 [@media(min-height:700px)]:sm:text-[2.4rem]/13'
  const tightAuthorStyle =
    '[@media(min-height:350px)]:text-[1.25rem]/6 [@media(min-height:600px)]:text-[1.3rem]/7 [@media(min-height:700px)]:text-[1.4rem]/8 [@media(min-height:700px)]:sm:text-[1.6rem]/10'

  const tighterCardStyle =
    'gap-1 px-2 [@media(min-height:500px)]:px-4 [@media(min-height:600px)]:px-6 [@media(min-height:700px)]:gap-2 sm:gap-4 sm:px-7 sm:py-3'
  const tighterTitleStyle =
    '[@media(min-height:350px)]:text-[1.5rem]/7  [@media(min-height:600px)]:text-[1.55rem]/7 [@media(min-height:700px)]:text-[2rem]/10 [@media(min-height:700px)]:sm:text-[2.4rem]/12'

  const cardStyle = veryLongTitle
    ? tighterCardStyle
    : longTitle || longAuthor
      ? tightCardStyle
      : regularCardStyle

  const titleStyle = veryLongTitle
    ? tighterTitleStyle
    : longTitle
      ? tightTitleStyle
      : regularTitleStyle

  const authorStyle = longAuthor || veryLongTitle ? tightAuthorStyle : regularAuthorStyle

  // Selected styling is applied on mobile when user taps a book, to provide feedback on their
  // selection while the next match is being prepared and transitioned in.
  // On desktop, hover effects provide sufficient feedback, so we don't apply selected styling.
  const selectedStyling = isSelected
    ? 'scale-85 -translate-y-2 border-primary/80 bg-background text-primary shadow-2xl'
    : 'text-text border-accent/80 bg-linear-to-b from-[oklch(0.860_0.152_97.399)] to-[oklch(0.815_0.152_97.399)] shadow-lg'

  const hoverStyling =
    'md:hover:-translate-y-2 md:hover:scale-[1.02] md:hover:border-primary/80 md:hover:bg-linear-to-b md:hover:from-sky-800 md:hover:to-sky-900 md:hover:text-primary md:hover:shadow-2xl md:hover:brightness-105 max-md:active:scale-95 max-md:active:border-primary/80 max-md:active:bg-linear-to-b max-md:active:from-sky-800 max-md:active:to-sky-900 max-md:active:text-primary max-md:active:shadow-2xl'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-[95%] flex-1 basis-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-b-8 py-2 font-calistoga shadow-xl transition-all duration-300 md:border-b-8 lg:h-80 lg:flex-none lg:rounded-xl xl:h-72 [@media(max-height:500px)]:gap-0.5 [@media(max-height:500px)]:py-1 [@media(min-height:700px)]:w-11/12 [@media(min-height:700px)]:lg:w-116 [@media(min-height:700px)]:xl:w-134 ${hoverStyling} ${cardStyle} ${selectedStyling}`}
      style={{
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.20)',
      }}
    >
      <p
        className={`line-clamp-3 w-full p-1 text-[1.3rem]/6 font-medium text-balance wrap-break-word lg:line-clamp-3 [@media(min-height:600px)]:line-clamp-4 ${titleStyle}`}
      >
        {title}
      </p>
      <p
        className={`line-clamp-2 w-full font-zain text-[1.05rem]/5 font-light text-pretty wrap-break-word opacity-85 [@media(max-height:450px)]:font-medium ${authorStyle}`}
      >
        by <span className={italic ? 'italic' : ''}>{author}</span>
      </p>
    </button>
  )
}
