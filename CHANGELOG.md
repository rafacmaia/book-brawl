# Changelog

All notable changes to Book Brawl will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
