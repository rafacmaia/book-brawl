from db.connection import get_connection
from models import Book


def get_all():
    """Load all books, set their opponent/wins history, and set global Elo min/max."""
    Book.elo_min = 800
    Book.elo_max = 1200

    with get_connection() as conn:
        rows = conn.execute(
            "SELECT id, title, author, rating, elo FROM book"
        ).fetchall()

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
        rows = conn.execute("SELECT winner_id, loser_id FROM comparison").fetchall()
        for row in rows:
            w_id, l_id = row["winner_id"], row["loser_id"]
            book_map[w_id].record_opponent(l_id)
            book_map[l_id].record_opponent(w_id)
            book_map[w_id].record_won_over(l_id)

    Book.is_empty = len(books) == 0

    return books


def insert(book):
    """Insert a new book and set its ID."""
    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO book (title, author, rating, elo) VALUES (?, ?, ?, ?)",
            (book.title, book.author, book.rating, book.elo),
        )
        book.id = cursor.lastrowid


def update_elo(book):
    """Update the Elo score for a book."""
    with get_connection() as conn:
        conn.execute("UPDATE book SET elo = ? WHERE id = ?", (book.elo, book.id))


def get_elo_range():
    """Return min, max, and median Elo across all books."""
    with get_connection() as conn:
        result = conn.execute(
            "SELECT MIN(elo) as elo_min, MAX(elo) as elo_max FROM book"
        ).fetchone()

        return dict(result) if result and result["elo_min"] is not None else None
