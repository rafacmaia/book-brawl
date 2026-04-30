const ABS_SCORE_WEIGHT = 0.3
const LOC_SCORE_WEIGHT = 0.45
const DEN_SCORE_WEIGHT = 0.25

const ABS_PERCENTAGE = 0.1
const ABS_MIN_OPPONENTS = 8
const LOCAL_WINDOW = 0.12

// const REMATCH_PENALTY_MULTIPLIER = 3
// const ELO_GAP_WINDOW = 150
// const MIN_SAMPLING_WEIGHT = 0.1
// const MIN_OPPONENT_WEIGHT = 0.05

export interface Book {
  id: number
  title: string
  author: string
  elo: number
  facedOpponents: Record<number, number>
}

export interface Match {
  bookA: Book
  bookB: Book
}

const WEIGHT_SUM = ABS_SCORE_WEIGHT + LOC_SCORE_WEIGHT + DEN_SCORE_WEIGHT
if (Math.abs(WEIGHT_SUM - 1) > 1e-10) {
  throw new Error(`Score weights must sum to 1, got ${WEIGHT_SUM}`)
}

export function selectOpponents(books: Book[]): [Book, Book] {
  if (books.length < 2) throw new Error('Not enough books to select opponents')

  if (books.length === 2) return [books[0], books[1]]

  // const confidenceScores = Object.fromEntries(
  //   books.map((book) => [book.id, confidenceScore(book, books)])
  // )

  // TODO: Replace this once you finish hooking up confidence scores from commented out code above
  const confidenceScores: [Book, number][] = books.map((book) => [
    book,
    confidenceScore(book, books),
  ])

  const bookA = confidenceScores[Math.floor(Math.random() * books.length)][0]
  const bookB = confidenceScores[Math.floor(Math.random() * books.length)][0]

  return [bookA, bookB]
}

function confidenceScore(book: Book, books: Book[]): number {
  if (books.length < 1) return 0

  if (books.length === 1) return 1

  const absScoreWeighted = ABS_SCORE_WEIGHT * absoluteScore(book, books)

  const locScoreWeighted = LOC_SCORE_WEIGHT * localScore(book, books)

  // TODO: port densityScore and replace this placeholder
  const denScoreWeighted = DEN_SCORE_WEIGHT * 0.5

  return absScoreWeighted + locScoreWeighted + denScoreWeighted
}

/**
 * Calculates a book's absolute score: a measure of a book's minimum number of faced opponents.
 * Scales with library size.
 *
 * @returns A number between 0 and 1, where 1 means the book has faced a target number of opponents.
 */
function absoluteScore(book: Book, books: Book[]): number {
  if (books.length <= 1) return 1

  const absoluteCap =
    books.length > ABS_MIN_OPPONENTS / ABS_PERCENTAGE
      ? Math.max(books.length * ABS_PERCENTAGE, ABS_MIN_OPPONENTS)
      : Math.min(books.length - 1, ABS_MIN_OPPONENTS)

  const opponentsCount = Object.keys(book.facedOpponents).length

  return Math.min(opponentsCount / absoluteCap, 1)
}

/**
 * Calculates a book's local score: a measure of how many of its most relevant opponents a book has
 * faced (those where expected Elo is most uncertain)
 *
 * @returns A number between 0 and 1, where 1 means the book has faced all relevant opponents.
 */
function localScore(book: Book, books: Book[]): number {
  if (books.length <= 1) return 1

  let relevantOpponents = 0
  let relevantOpponentsFaced = 0

  for (const opponent of books) {
    if (
      opponent.id !== book.id &&
      Math.abs(expectedScore(book.elo, opponent.elo) - 0.5) <= LOCAL_WINDOW
    ) {
      relevantOpponents++
      if (opponent.id in book.facedOpponents) relevantOpponentsFaced++
    }
  }

  return relevantOpponents ? relevantOpponentsFaced / relevantOpponents : 1
}

/**
 * Calculates the probability that a book wins against a given opponent.
 *
 * @returns A number between 0 and 1, where 1 means the book would almost certainly win.
 */
function expectedScore(bookElo: number, opponentElo: number): number {
  return 1 / (1 + 10 ** ((opponentElo - bookElo) / 400))
}
