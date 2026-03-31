import sqlite3

import state


def get_connection(path=None):
    if path is None:
        path = state.db_path
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row  # allows access by field name instead of just index
    return conn


def init_db(path):
    with get_connection(path) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS user (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                username  TEXT    NOT NULL UNIQUE,
                email     TEXT    NOT NULL UNIQUE,
                clerk_id  TEXT    NOT NULL UNIQUE
            )
      """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS book (
                id      INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES user(id),
                title   TEXT    NOT NULL,
                author  TEXT    NOT NULL,
                rating  REAL    DEFAULT NULL,
                elo     INTEGER DEFAULT 1000,
                UNIQUE (user_id, title, author)  -- the same book can exist for different users
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS comparison (
                id         INTEGER      PRIMARY KEY AUTOINCREMENT,
                user_id    INTEGER      REFERENCES user(id),
                winner_id  INTEGER      NOT NULL REFERENCES book(id),
                loser_id   INTEGER      NOT NULL REFERENCES book(id),
                timestamp  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Create indexes for faster lookups on foreign keys and commonly queried fields
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_comparison_winner ON comparison(winner_id)"
        )

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_comparison_loser ON comparison(loser_id)"
        )

        conn.execute("CREATE INDEX IF NOT EXISTS idx_book_user ON book(user_id)")

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_comparison_user ON comparison(user_id)"
        )
