# Changelog

All notable changes to Book Brawl will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Progress labels to the Leaderboard progress bar.

### Changed

- Matchmaking logic: rarer repeats and faster progress (more informative matches).
- Refined progress calculation so it better reflects ranking stability.
- Brawl Pit logic so the same book rarely comes up twice in a row.
- Hid percentage display once rankings are essentially settled (97%+).
- Clerk-related UI to match the rest of the app's design.
- Nav bar to be icon-based on mobile.
- Improved empty state messaging throughout (added icons and appropriate links)
- Tweaked book card formatting: better responsiveness across screen sizes and varying
  title/author lengths.

### Fixed

- Bug where the leaderboard was locked until 100% progress was reached.
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
