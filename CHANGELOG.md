# Changelog

All notable changes to Book Brawl will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.1] - 2026-06-17

### Changed

- Users now get more specific error messaging instead of a generic "Something went
  wrong".
- Copy across all pages to be clearer, less technical, and more consistent with the app's
  tone.

### Fixed

- Visiting an unknown or outdated URL redirects to the Brawl Pit instead of showing a
  blank page.
- Bug where long book titles might flicker into position during match fade-in.
- Bug where the progress percentage was being hidden prematurely, before reaching
  progress completion.
- Bug where CSV book imports were all dropped if the book limit is reached mid-import.
  Books are now added up until the limit is reached.
- Bug where CSV book imports were all dropped if the DB detected an uncaught duplicate.
- Bug where books were being ordered case-sensitively, so lower-case titles were being
  listed separately.

## [1.2.0] - 2026-05-23

### Added

- Onboarding flow for new users, offering three paths: Goodreads CSV import,
  manual entry, or custom CSV.
- Guided instructions for finding your Goodreads export file.
- More granular feedback after importing from a CSV file.
- Progress labels to the Leaderboard progress bar.

### Changed

- Matchmaking logic: rarer repeats and faster progress (more informative matches).
- Refine the progress calculation so it better reflects ranking stability.
- Brawl Pit logic so the same book rarely comes up twice in a row.
- Hide the percentage display once rankings are essentially settled (97%+).
- Clerk-related UI to match the rest of the app's design.
- Nav bar to be icon-based on mobile.
- Improve empty state messaging throughout (added icons and appropriate links).
- Tweak book card formatting: better responsiveness across screen sizes and varying
  title/author lengths.

### Fixed

- Race condition in user sync that could fire 409s on concurrent first-login requests (
  now uses an idempotent upsert).
- Bug where the leaderboard was locked until 100% progress was reached.
- White sliver on the right edge of the viewport caused by gradient and scrollbar-gutter
  interaction.
- Bug where the brawl pit froze in an empty state if the user resolved a match before
  the next match was fetched.
- Nav bar layout doesn't shift anymore when the Clerk avatar loads or when a new page is
  selected.
- Match transition effects now appear on mobile landscape mode as well.

## [1.1.0] - 2026-04-27

### Added

- Support for Goodreads export files during CSV import.
- Leaderboard now requires at least three brawls before rankings are shown.
- Responsive design for shorter screen sizes and landscape orientation.

### Changed

- "Manage Pit" page is now "The Stacks"
- Redesigned nav bar: icon-only on mobile, icon and label on desktop.
- Uniform modal layouts and icons across all pages.

### Fixed

- A race condition where pages would fire API calls before users were fully registered,
  causing 404 errors on first load.
- Removed an unnecessary uniqueness constraint on usernames, firing 409 errors when
  different users had the same username.

## [1.0.0] - 2026-04-22

### Added

- Full web app with Brawl Pit, Leaderboard, and Manage Pit pages.
- Per-user data isolation via Clerk authentication.
- CSV import, manual book entry, edit, delete, and full reset.
- Elo ranking with adaptive K-factor and accuracy scoring.
- PostgreSQL on Railway, frontend on Vercel.
