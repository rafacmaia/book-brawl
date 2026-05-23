from typing import Any

from psycopg2.extras import RealDictCursor, execute_values

from config import E_MAX_DEFAULT, E_MIN_DEFAULT
from db.connection import get_connection
from models import Book, BookDraft


def count(reader_id: int) -> int:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM book WHERE reader_id = %s",
                (reader_id,),
            )
            return cur.fetchone()[0]


def get_all(reader_id: int) -> list[dict[str, Any]]:
    """Return a reader's collection of books, sorted alphabetically by title."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, title, author FROM book
                WHERE reader_id = %s
                ORDER BY
                    REGEXP_REPLACE(title, '^(a|an|the)\\s+', '', 'i')
                """,
                (reader_id,),
            )
            return [dict(row) for row in cur.fetchall()]  # type: ignore[return-value]


def get_all_history(reader_id: int) -> list[Book]:
    """Load all books, set their opponent/wins history, and set global Elo min/max."""
    Book.elo_min = E_MIN_DEFAULT
    Book.elo_max = E_MAX_DEFAULT

    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT id, title, author, rating, elo FROM book WHERE reader_id = %s",
                (reader_id,),
            )
            rows = cur.fetchall()

    books = []
    for row in rows:
        book = Book(
            title=row["title"],
            author=row["author"],
            rating=row["rating"],
            elo=row["elo"],
            book_id=row["id"],
        )
        if book.elo < Book.elo_min:
            Book.elo_min = book.elo
        if book.elo > Book.elo_max:
            Book.elo_max = book.elo
        books.append(book)

    book_map = {b.id: b for b in books}
    with get_connection() as conn:
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


def insert_many(reader_id: int, books: list[BookDraft]) -> None:
    """Insert multiple books."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            execute_values(
                cur,
                "INSERT INTO book (reader_id, title, author, rating, elo) VALUES %s RETURNING id",
                [(reader_id, b.title, b.author, b.rating, b.elo) for b in books],
            )


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


def update_elo(book: Book) -> None:
    """Update the Elo score for a book."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE book SET elo = %s WHERE id = %s", (book.elo, book.id))


def get_elo_range(reader_id: int) -> dict | None:
    """Return min, max, and median Elo across all books."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT MIN(elo) as elo_min, MAX(elo) as elo_max FROM book WHERE reader_id = %s",
                (reader_id,),
            )
            result = cur.fetchone()

            return dict(result) if result and result["elo_min"] is not None else None
