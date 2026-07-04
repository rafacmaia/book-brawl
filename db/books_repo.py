from dataclasses import dataclass

from psycopg2.extras import RealDictCursor, execute_values

from db.connection import get_connection
from models import Book, BookDraft

# ====== TYPES


@dataclass
class BookRow:
    id: int
    title: str
    author: str


@dataclass
class BookMetadata:
    book_id: int
    cover_url: str | None
    isbn: str | None


@dataclass
class EloRange:
    min: int
    max: int


# ====== READS


def count(reader_id: int) -> int:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM book WHERE reader_id = %s",
                (reader_id,),
            )
            return cur.fetchone()[0]


def get_all(reader_id: int) -> list[BookRow]:
    """Return a reader's collection of books, sorted alphabetically by title."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, title, author FROM book
                WHERE reader_id = %s
                ORDER BY
                    REGEXP_REPLACE(LOWER(title), '^(a|an|the)\\s+', '')
                """,
                (reader_id,),
            )
            return [BookRow(**row) for row in cur.fetchall()]


def get_all_history(reader_id: int) -> list[Book]:
    """Load all books, set their opponent/wins history, and set global Elo min/max."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT id, title, author, elo, rating, cover_url FROM book WHERE reader_id = %s",
                (reader_id,),
            )
            books = [Book(**row) for row in cur.fetchall()]

        book_map = {b.id: b for b in books}

        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT winner_id, loser_id FROM comparison WHERE reader_id = %s",
                (reader_id,),
            )
            for row in cur.fetchall():
                w_id, l_id = row["winner_id"], row["loser_id"]
                book_map[w_id].record_opponent(l_id)
                book_map[l_id].record_opponent(w_id)
                book_map[w_id].record_won_over(l_id)

    return books


def get_missing_covers(reader_id: int) -> list[BookRow]:
    """Return a reader's books that don't have a cover URL."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT id, title, author FROM book WHERE reader_id = %s AND cover_url IS NULL",
                (reader_id,),
            )
            return [BookRow(**row) for row in cur.fetchall()]


def get_elo_range(reader_id: int) -> EloRange | None:
    """Return min and max Elo across all books."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT MIN(elo) as min, MAX(elo) as max FROM book WHERE reader_id = %s",
                (reader_id,),
            )
            result = cur.fetchone()

            return (
                EloRange(**dict(result))
                if result and result["min"] is not None
                else None
            )


# ====== INSERTS


def insert(reader_id: int, book: BookDraft) -> Book:
    """Insert a new book."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                    INSERT INTO book (reader_id, title, author, rating, elo, isbn, cover_url) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s) 
                    RETURNING id, title, author, elo, rating, isbn, cover_url
                """,
                (
                    reader_id,
                    book.title,
                    book.author,
                    book.rating,
                    book.elo,
                    book.isbn,
                    book.cover_url,
                ),
            )
            return Book(**cur.fetchone())


def insert_many(reader_id: int, books: list[BookDraft], *, conn=None) -> int:
    """Insert multiple books, skipping rows that collide with the unique constraint.

    Returns the count of books actually inserted (collisions excluded).
    """
    if not books:
        return 0

    def _execute(connection):
        with connection.cursor() as cur:
            result = execute_values(
                cur,
                """
                INSERT INTO book (reader_id, title, author, rating, elo, isbn, cover_url) 
                VALUES %s
                ON CONFLICT (reader_id, LOWER(title), LOWER(author)) DO NOTHING
                RETURNING id
                """,
                [
                    (reader_id, b.title, b.author, b.rating, b.elo, b.isbn, b.cover_url)
                    for b in books
                ],
                fetch=True,
            )
            return len(result)

    if conn:
        return _execute(conn)
    else:
        with get_connection() as c:
            return _execute(c)


# ====== UPDATES


def update_title_and_author(
    reader_id: int, book_id: int, title: str, author: str
) -> bool:
    """Update a book's title and author, returning True if the update was successful."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE book SET title = %s, author = %s WHERE reader_id = %s AND id = %s",
                (title, author, reader_id, book_id),
            )
            return cur.rowcount > 0


def update_cover_and_isbn(update: BookMetadata) -> bool:
    """Set the cover URL and ISBN for a book, returning True if the update was successful."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE book 
                SET cover_url = COALESCE(%s, cover_url), 
                    isbn = COALESCE(%s, isbn) 
                WHERE id = %s
                """,
                (update.cover_url, update.isbn, update.book_id),
            )
            return cur.rowcount > 0


def update_covers_and_isbns(updates: list[BookMetadata], *, conn=None) -> None:
    """Bulk-update cover URLs and ISBNs for many books in a single statement.

    Used by backfill scripts to fetch covers and ISBNs of books that were already in
    the system before cover and ISBN support.
    """
    if not updates:
        return

    def _execute(connection):
        with connection.cursor() as cur:
            execute_values(
                cur,
                """
                UPDATE book AS b
                SET cover_url = COALESCE(v.cover_url, b.cover_url), 
                    isbn = COALESCE(v.isbn, b.isbn)
                FROM (VALUES %s) AS v(id, cover_url, isbn)
                WHERE b.id = v.id
                """,
                [(u.book_id, u.cover_url, u.isbn) for u in updates],
            )

    if conn:
        _execute(conn)
    else:
        with get_connection() as c:
            _execute(c)


def update_elo(book: Book, *, conn=None) -> None:
    """Update the Elo score for a book."""

    def _execute(connection):
        with connection.cursor() as cur:
            cur.execute("UPDATE book SET elo = %s WHERE id = %s", (book.elo, book.id))

    if conn:
        _execute(conn)
    else:
        with get_connection() as c:
            _execute(c)


# ====== DELETES


def delete(reader_id: int, book_id: int) -> bool:
    """Delete a book by ID."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM book WHERE reader_id = %s AND id = %s",
                (reader_id, book_id),
            )
            return cur.rowcount > 0


def delete_all(reader_id: int) -> None:
    """Delete all books for a reader."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM book WHERE reader_id = %s", (reader_id,))
