from dataclasses import dataclass
from typing import Iterable

from config import (
    BOOK_LIMIT,
    E_MAX_DEFAULT,
    E_MIN_DEFAULT,
    ELO_DEFAULT,
    RATING_FLOOR,
    RATING_FLOOR_BUMP,
)
from db.books_repo import get_all, get_elo_range, insert, insert_many
from models import Book, BookDraft


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


# ====== SINGLE BOOK INSERT


def add_book(
    reader_id: int, title: str, author: str, rating: float | None = None
) -> Book:
    """Add a single book to the database, ensuring no duplicates."""
    if rating is not None and not (1 <= rating <= 10):
        raise ValueError("Rating must be between 1 and 10")

    if not (title.strip() and author.strip()):
        raise ValueError("Title and author are required")

    # Get current Elo range to scale new books appropriately, defaulting to the
    # standard 800-1200 range if no books exist yet.
    elo_range = get_elo_range(reader_id) or {
        "elo_min": E_MIN_DEFAULT,
        "elo_max": E_MAX_DEFAULT,
    }
    elo = _rating_to_elo(elo_range, rating)

    book_id = insert(reader_id, BookDraft(title, author, elo, rating))

    return Book(book_id, title, author, elo, rating)


# ====== CSV IMPORT: BULK BOOK INSERT


def import_books(
    reader_id: int, source: str, file_reader: Iterable[dict[str, str | None]]
) -> ImportResult:
    """Process each row of the CSV, adding new books to the database.

    Validates each row, skipping duplicate and invalid entries.
    """
    # Build set of existing books for fast duplicate detection
    books = get_all(reader_id)
    existing_books = {(b["title"].lower(), b["author"].lower()) for b in books}

    # Get current Elo range to scale new books appropriately, defaulting to the
    # standard 800-1200 range if no books exist yet.
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

    # Skip rows missing title or author and duplicates
    if not (title and author) or (title.lower(), author.lower()) in existing_books:
        result.skipped += 1
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


# Dispatch table to identify the right function to process a row of a CSV file,
# based on the source of the data: custom or Goodreads.
ROW_PROCESSORS = {
    "custom": _process_row,
    "goodreads": _process_goodreads_row,
}


# ====== RATING TO ELO CONVERSION


def _rating_to_elo(elo_range: dict[str, int], raw_rating: float | None) -> int:
    """Convert a user rating, or lack of, to an Elo score."""
    if raw_rating is None:
        return ELO_DEFAULT

    elo_min = elo_range["elo_min"]
    elo_max = elo_range["elo_max"]

    # If Elo scores have not strayed from the default window, map to it, otherwise,
    # map to the current elo range.
    if elo_min >= E_MIN_DEFAULT and elo_max <= E_MAX_DEFAULT:
        elo = (raw_rating - 1) * ((E_MAX_DEFAULT - E_MIN_DEFAULT) / 9) + E_MIN_DEFAULT
        return round(elo)
    else:
        # Real-world ratings skew high — books rated 1-2 are rare, so in an ongoing
        # library where the Elo range has shifted from the defaults, books near the
        # current elo_min likely represent ratings around 3-5 instead of 1-3. So a new
        # entry rated 6/10 should map to the lower-middle of the current range, not the
        # 60th percentile. To do this, we use a RATING_FLOOR=3 (tunable) instead of 1.
        rating = max(raw_rating, RATING_FLOOR)
        elo = round((rating - RATING_FLOOR) * ((elo_max - elo_min) / 7) + elo_min)

        # The floor bump (one K-value above elo_min) keeps a book from starting at the
        # literal Elo minimum, still in reach of the bottom, but not pinned to it.
        return max(elo, elo_min + RATING_FLOOR_BUMP)
