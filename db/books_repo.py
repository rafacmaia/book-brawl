from dataclasses import dataclass
from typing import Any

from psycopg2.extras import RealDictCursor, execute_values

from db.connection import get_connection
from models import Book, BookDraft


@dataclass
class BookRow:
    id: int
    title: str
    author: str


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
                "SELECT id, title, author, elo, rating FROM book WHERE reader_id = %s",
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


def insert(reader_id: int, book: BookDraft) -> int:
    """Insert a new book."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                    INSERT INTO book (reader_id, title, author, rating, elo) 
                    VALUES (%s, %s, %s, %s, %s) 
                    RETURNING id
                """,
                (reader_id, book.title, book.author, book.rating, book.elo),
            )
            return cur.fetchone()["id"]


def insert_many(reader_id: int, books: list[BookDraft], *, conn=None) -> list[int]:
    """Insert multiple books, skipping rows that collide with the unique constraint.

    Returns the IDs of books actually inserted (collisions excluded).
    """
    if not books:
        return []

    def _execute(connection):
        with connection.cursor() as cur:
            result = execute_values(
                cur,
                """
                INSERT INTO book (reader_id, title, author, rating, elo) 
                VALUES %s
                ON CONFLICT (reader_id, LOWER(title), LOWER(author)) DO NOTHING
                RETURNING id
                """,
                [(reader_id, b.title, b.author, b.rating, b.elo) for b in books],
                fetch=True,
            )
            return [row[0] for row in result]

    if conn:
        return _execute(conn)
    else:
        with get_connection() as c:
            return _execute(c)


def update(reader_id: int, book_id: int, title: str, author: str) -> bool:
    """Update an existing book."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE book SET title = %s, author = %s WHERE reader_id = %s AND id = %s",
                (title, author, reader_id, book_id),
            )
            return cur.rowcount > 0


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


def get_elo_range(reader_id: int) -> dict | None:
    """Return min and max Elo across all books."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT MIN(elo) as elo_min, MAX(elo) as elo_max FROM book WHERE reader_id = %s",
                (reader_id,),
            )
            result = cur.fetchone()

            return dict(result) if result and result["elo_min"] is not None else None
