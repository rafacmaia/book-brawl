-- Book Brawl Database Schema
-- Last updated: 2026-06-13
--
-- To recreate the database from scratch, run this via psql:
--   psql $DATABASE_URL < db/schema.sql
-- Or paste into Railway's database query console.

CREATE TABLE IF NOT EXISTS reader (
    id          SERIAL  PRIMARY KEY,
    username    TEXT    NOT NULL,
    email       TEXT    NOT NULL,
    clerk_id    TEXT    NOT NULL UNIQUE
);


CREATE TABLE IF NOT EXISTS book (
    id          SERIAL      PRIMARY KEY,
    reader_id   INTEGER     NOT NULL REFERENCES reader(id) ON DELETE CASCADE,
    title       TEXT        NOT NULL,
    author      TEXT        NOT NULL,
    rating      REAL,
    elo         INTEGER     NOT NULL,
    CONSTRAINT title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
    CONSTRAINT author_not_empty CHECK (LENGTH(TRIM(author)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_book_unique_title_author
    ON book(reader_id, LOWER(title), LOWER(author));


CREATE TABLE IF NOT EXISTS comparison (
    id         SERIAL       PRIMARY KEY,
    reader_id  INTEGER      NOT NULL REFERENCES reader(id) ON DELETE CASCADE,
    winner_id  INTEGER      NOT NULL REFERENCES book(id) ON DELETE CASCADE,
    loser_id   INTEGER      NOT NULL REFERENCES book(id) ON DELETE CASCADE,
    timestamp  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
    CONSTRAINT comparison_no_self_match CHECK (winner_id <> loser_id)
);


CREATE INDEX IF NOT EXISTS idx_book_user            ON book(reader_id);
CREATE INDEX IF NOT EXISTS idx_comparison_user      ON comparison(reader_id);
CREATE INDEX IF NOT EXISTS idx_comparison_winner    ON comparison(winner_id);
CREATE INDEX IF NOT EXISTS idx_comparison_loser     ON comparison(loser_id);
