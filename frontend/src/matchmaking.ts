const ABS_SCORE_WEIGHT = 0.3
const LOC_SCORE_WEIGHT = 0.45
const DEN_SCORE_WEIGHT = 0.25

const ABS_PERCENTAGE = 0.1
const ABS_MIN_OPPONENTS = 8
const LOCAL_WINDOW = 0.12
const DENSITY_WINDOW = 20
const DENSITY_CAP = 10

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

// Sanity check to make sure score weights sum to 1 before matchmaking runs
const WEIGHT_CHECK = ABS_SCORE_WEIGHT + LOC_SCORE_WEIGHT + DEN_SCORE_WEIGHT
if (Math.abs(WEIGHT_CHECK - 1) > 1e-10) {
  throw new Error(`Score weights must sum to 1, got ${WEIGHT_CHECK}`)
}

/**
 * Selects two books using weighted random selection. Favors low-confidence books, books that have
 * been matched against each other less often, and books with similar Elo scores, to maximize
 * overall progress gain per match.
 * Throws an error if the input array contains fewer than two books.
 *
 * @returns A tuple containing two selected Book objects.
 */
export function selectOpponents(books: Book[]): [Book, Book] {
  if (books.length < 2) throw new Error('Not enough books')

  if (books.length === 2) return [books[0], books[1]]

  // Calculate confidence scores for all books.
  const confidenceScores = Object.fromEntries(
    books.map((book) => [book.id, confidenceScore(book, books)])
  )

  const weights = books.map((book) => samplingWeight(book, confidenceScores[book.id], books))

  // TODO: Finish this, select bookA using weights then select bookB based on bookA

  return [bookA, bookB]
}

/**
 * Calculates the selection weight of a book based on its confidence score, giving a boost to
 * books with very few matches in.
 *
 * @returns A number between 0.05 (minimum weight) and a ceiling that scales with library size.
 */
function samplingWeight(book: Book, bookConfidence: number, books: Book[]): number {
  if (books.length <= 1) return 1

  // Boost scales with library size and absolute_score: larger collections require higher boosts to
  // make a difference, and lower absolute_score requires a higher boost to get early data in.
  const earlyBoost = books.length * ABS_PERCENTAGE * (1 - absoluteScore(book, books))
  const confidenceWeight = 1 - bookConfidence

  return Math.max(0.05, confidenceWeight, earlyBoost)
}

// ====== CONFIDENCE SCORING

/**
 * Calculates a book's confidence score: a measure of the accuracy of a book's current rank.
 * Uses a weighted combination of: the raw number of opponents faced, number of faced opponents with
 * similar score, and local density in overall rankings to account for, respectively, overall
 * confidence, local confidence, and rank stability.
 *
 * @returns A number between 0 and 1, where 1 means very high confidence.
 */
function confidenceScore(book: Book, books: Book[]): number {
  if (books.length < 1) return 0

  if (books.length === 1) return 1

  const absScoreWeighted = ABS_SCORE_WEIGHT * absoluteScore(book, books)

  const locScoreWeighted = LOC_SCORE_WEIGHT * localScore(book, books)

  const staScoreWeighted = DEN_SCORE_WEIGHT * stabilityScore(book, books)

  return absScoreWeighted + locScoreWeighted + staScoreWeighted
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
 * Calculates a book's stability score: a measure of how many books have a very similar ELo score,
 * meaning their ranks can easily flip within one or two matches.
 *
 * @returns A number between 0 and 1, where 1 means the book has no close opponents.
 */
function stabilityScore(book: Book, books: Book[]): number {
  if (books.length <= 1) return 1

  let tightNeighbors = 0

  for (const opponent of books) {
    if (opponent.id !== book.id && Math.abs(book.elo - opponent.elo) <= DENSITY_WINDOW)
      tightNeighbors++
  }

  const neighborsCap = Math.min(books.length - 1, DENSITY_CAP)

  const density = Math.min(tightNeighbors / neighborsCap, 1)

  return 1 - density
}

/**
 * Calculates the probability that a book wins against a given opponent.
 *
 * @returns A number between 0 and 1, where 1 means the book would almost certainly win.
 */
function expectedScore(bookElo: number, opponentElo: number): number {
  return 1 / (1 + 10 ** ((opponentElo - bookElo) / 400))
}
