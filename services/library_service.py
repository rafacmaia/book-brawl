from dataclasses import dataclass
from typing import Iterable

from config import BOOK_LIMIT
from db.books_repo import get_all, get_elo_range, insert, insert_many
from models import Book, BookDraft
from services.scoring_service import K_TIERS

ELO_DEFAULT = 1040
E_MIN_DEFAULT = 800
E_MAX_DEFAULT = 1200


RATING_FLOOR = 3
RATING_FLOOR_BUMP = K_TIERS[0][1]  # One initial K-value above the floor


@dataclass
class ImportResult:
    new_books: list[BookDraft]
    skipped: int
    interrupted: bool


@dataclass
class BookData:
    title: str
    author: str
    rating: float | None = None


def add_book(
    reader_id: int, title: str, author: str, rating: float | None = None
) -> Book:
    """Add a single book to the database, ensuring no duplicates."""
    if rating is not None and not (1 <= rating <= 10):
        raise ValueError("Rating must be between 1 and 10")

    if not (title.strip() and author.strip()):
        raise ValueError("Title and author are required")

    elo_range = get_elo_range(reader_id) or {
        "elo_min": E_MIN_DEFAULT,
        "elo_max": E_MAX_DEFAULT,
    }
    elo = _rating_to_elo(elo_range, rating)

    book_id = insert(reader_id, BookDraft(title, author, elo, rating))

    return Book(book_id, title, author, elo, rating)


def import_books(
    reader_id: int, source: str, file_reader: Iterable[dict[str, str | None]]
) -> ImportResult:
    """Process each row of the CSV, adding new books to the database.

    Validates each row, skipping duplicate and invalid entries.
    """
    books = get_all(reader_id)
    existing_books = {(b["title"].lower(), b["author"].lower()) for b in books}

    elo_range = get_elo_range(reader_id) or {
        "elo_min": E_MIN_DEFAULT,
        "elo_max": E_MAX_DEFAULT,
    }

    result = ImportResult(new_books=[], skipped=0, interrupted=False)

    row_processor = ROW_PROCESSORS[source]

    for row in file_reader:
        if len(existing_books) >= BOOK_LIMIT:
            result.interrupted = True
            return result

        book_data = row_processor(row, existing_books, result)

        if book_data is not None:
            elo = _rating_to_elo(elo_range, book_data.rating)
            book = BookDraft(book_data.title, book_data.author, elo, book_data.rating)
            result.new_books.append(book)
            existing_books.add((book_data.title.lower(), book_data.author.lower()))

    insert_many(reader_id, result.new_books)

    return result


def _process_row(
    row: dict[str, str | None],
    existing_books: set[tuple[str, str]],
    result: ImportResult,
) -> BookData | None:
    """Validate and process a single CSV row, updating the import result in place."""
    title = (row.get("title") or "").strip()
    author = (row.get("author") or "").strip()
    raw_rating = (row.get("rating") or "").strip()

    if not (title or author):
        return None  # Ignore empty rows

    if not (title and author) or (title.lower(), author.lower()) in existing_books:
        result.skipped += 1  # Skip rows missing title or author
        return None

    try:
        rating = float(raw_rating)
        if not (1 <= rating <= 10):
            raise ValueError
    except ValueError:
        rating = None

    return BookData(title, author, rating)


def _process_goodreads_row(
    row: dict[str, str | None],
    existing_books: set[tuple[str, str]],
    result: ImportResult,
) -> BookData | None:
    """Validate and process a single CSV row from a Goodreads export file.

    Updates the import result in place.
    """
    shelf = (row.get("exclusive shelf") or "").lower().strip()

    try:
        raw_rating = float(row.get("my rating") or 0)
    except (ValueError, TypeError):
        raw_rating = 0

    # Check if the book is on the "read" shelf or has a valid rating, otherwise skip
    if shelf != "read" and not (1 <= raw_rating <= 5):
        result.skipped += 1
        return None

    title = (row.get("title") or "").strip()
    author = (row.get("author") or "").strip()

    if not (title or author):
        return None  # Ignore empty rows

    # Skip duplicates and rows missing title or author
    if not (title and author) or (title.lower(), author.lower()) in existing_books:
        result.skipped += 1
        return None

    # Convert Goodreads rating to a 10-point scale if present
    rating = None if raw_rating == 0 else raw_rating * 2

    return BookData(title, author, rating)


ROW_PROCESSORS = {
    "custom": _process_row,
    "goodreads": _process_goodreads_row,
}


def _rating_to_elo(elo_range: dict[str, int], raw_rating: float | None) -> int:
    """Convert a user rating, or lack of, to an Elo score."""
    if raw_rating is None:
        return ELO_DEFAULT

    elo_min = elo_range["elo_min"]
    elo_max = elo_range["elo_max"]

    if elo_min >= E_MIN_DEFAULT and elo_max <= E_MAX_DEFAULT:
        # Map rating to the starting 800-1200 Elo range
        elo = E_MIN_DEFAULT + (raw_rating - 1) * ((E_MAX_DEFAULT - E_MIN_DEFAULT) / 9)
        return round(elo)
    else:
        # Maps rating to Elo using a floor of 3 rather than 1, reflecting that
        # real-world ratings rarely fall below 3/10. The floor bump ensures a book
        # rated at the floor doesn't start at the literal Elo minimum — it begins one
        # K-value above, within reach of the bottom but not pinned there.
        rating = max(RATING_FLOOR, raw_rating)
        elo = round(elo_min + (rating - 3) * ((elo_max - elo_min) / 7))
        return max(elo, elo_min + RATING_FLOOR_BUMP)
