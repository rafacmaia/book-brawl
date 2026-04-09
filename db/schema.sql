-- Book Brawl Database Schema
-- Last updated: 2026-04-09
--
-- To recreate the database from scratch, run this via psql:
--   psql $DATABASE_URL < db/schema.sql
-- Or paste into Railway's database query console.

CREATE TABLE IF NOT EXISTS reader (
    id          SERIAL  PRIMARY KEY,
    username    TEXT    NOT NULL UNIQUE,
    email       TEXT    NOT NULL UNIQUE,
    clerk_id    TEXT    NOT NULL UNIQUE
);


CREATE TABLE IF NOT EXISTS book (
    id          SERIAL      PRIMARY KEY,
    reader_id   INTEGER     NOT NULL REFERENCES reader(id),
    title       TEXT        NOT NULL,
    author      TEXT        NOT NULL,
    rating      REAL,
    elo         INTEGER     NOT NULL,
    UNIQUE (reader_id, title, author)
);


CREATE TABLE IF NOT EXISTS comparison (
    id         SERIAL       PRIMARY KEY,
    reader_id  INTEGER      NOT NULL REFERENCES reader(id),
    winner_id  INTEGER      NOT NULL REFERENCES book(id),
    loser_id   INTEGER      NOT NULL REFERENCES book(id),
    timestamp  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX IF NOT EXISTS idx_book_user            ON book(reader_id);
CREATE INDEX IF NOT EXISTS idx_comparison_user      ON comparison(reader_id);
CREATE INDEX IF NOT EXISTS idx_comparison_winner    ON comparison(winner_id);
CREATE INDEX IF NOT EXISTS idx_comparison_loser     ON comparison(loser_id);
