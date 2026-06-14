import type { components } from './schema'

export type User = components['schemas']['UserSync']
export type UserBookCount = components['schemas']['UserBookCount']

export type Book = components['schemas']['BookSummary']
export type BookData = components['schemas']['BookData']

export type Match = components['schemas']['Match']
export type MatchOutcome = components['schemas']['MatchOutcome']

export type BookStanding = components['schemas']['BookStanding']
export type Rankings = BookStanding[]
export type Progress = components['schemas']['Progress']

export type Library = Book[]

export type ImportOutcome = components['schemas']['ImportOutcome']
export type FileSource = components['schemas']['FileSource']
