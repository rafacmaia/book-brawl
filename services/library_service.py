from dataclasses import dataclass
from enum import Enum, auto
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
from db.connection import get_connection
from models import Book, BookDraft


class RowStatus(Enum):
    IGNORE = auto()
    INVALID = auto()
    DUPLICATE = auto()
    VALID = auto()


@dataclass
class ImportResult:
    imported: int = 0
    invalid: int = 0
    duplicates: int = 0
    interrupted: bool = False

    def record(self, status: RowStatus) -> None:
        if status is RowStatus.INVALID:
            self.invalid += 1
        elif status is RowStatus.DUPLICATE:
            self.duplicates += 1
        elif status is RowStatus.VALID:
            self.imported += 1
        # Silently skip IGNORE rows


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

    row_processor = ROW_PROCESSORS[source]
    result = ImportResult()  # Set up the result object
    new_books = []

    for row in file_reader:
        if len(existing_books) >= BOOK_LIMIT:
            result.interrupted = True
            break

        status, book_data = row_processor(row, existing_books)
        result.record(status)

        if book_data is not None:
            elo = _rating_to_elo(elo_range, book_data.rating)
            book = BookDraft(book_data.title, book_data.author, elo, book_data.rating)
            new_books.append(book)
            existing_books.add((book_data.title.lower(), book_data.author.lower()))

    if new_books:
        with get_connection(transactional=True) as conn:
            inserted_books = insert_many(reader_id, new_books, conn=conn)

            # Check if any books were rejected due to uniqueness constraint, meaning
            # any duplicates that weren't captured before the insert.
            db_conflicts = len(new_books) - len(inserted_books)

            result.imported -= db_conflicts
            result.duplicates += db_conflicts

    return result


def _process_row(
    row: dict[str, str | None],
    existing_books: set[tuple[str, str]],
) -> tuple[RowStatus, BookData | None]:
    """Validate and process a single CSV row."""
    status, title, author = _parse_title_author(row, existing_books)
    if status is not RowStatus.VALID:
        return status, None

    raw_rating = (row.get("rating") or "").strip()
    try:
        rating = float(raw_rating)
        if not (1 <= rating <= 10):
            raise ValueError
    except ValueError:
        rating = None

    return status, BookData(title, author, rating)


def _process_goodreads_row(
    row: dict[str, str | None],
    existing_books: set[tuple[str, str]],
) -> tuple[RowStatus, BookData | None]:
    """Validate and process a single CSV row from a Goodreads export file."""
    # Read the "exclusive shelf" column, which indicates whether the book is on the
    # "read" shelf or another shelf.
    shelf = (row.get("exclusive shelf") or "").lower().strip()

    try:
        raw_rating = float(row.get("my rating") or 0)
    except (ValueError, TypeError):
        raw_rating = 0

    # Check if the book is on the "read" shelf or has a valid rating, otherwise skip
    if shelf != "read" and not (1 <= raw_rating <= 5):
        return RowStatus.IGNORE, None

    # Extract and validate title and author
    status, title, author = _parse_title_author(row, existing_books)
    if status is not RowStatus.VALID:
        return status, None

    # Convert Goodreads rating to a 10-point scale if present
    rating = None if raw_rating == 0 else raw_rating * 2

    return status, BookData(title, author, rating)


# Dispatch table to identify the right function to process a row of a CSV file,
# based on the source of the data: custom or Goodreads.
ROW_PROCESSORS = {
    "custom": _process_row,
    "goodreads": _process_goodreads_row,
}


def _parse_title_author(
    row: dict[str, str | None], existing_books: set[tuple[str, str]]
) -> tuple[RowStatus, str, str]:
    """Extract and validate title and author.

    Check for empty rows, missing title or author, and duplicates.
    """
    title = (row.get("title") or "").strip()
    author = (row.get("author") or "").strip()

    if not (title or author):  # Check for empty rows
        return RowStatus.IGNORE, title, author

    if not (title and author):  # Check for rows missing title or author
        return RowStatus.INVALID, title, author

    if (title.lower(), author.lower()) in existing_books:  # Check for duplicates
        return RowStatus.DUPLICATE, title, author

    return RowStatus.VALID, title, author


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
        # 60th percentile. To do this, we use a (tunable) RATING_FLOOR above 1.
        rating = max(raw_rating, RATING_FLOOR)
        elo = round(
            (rating - RATING_FLOOR) * ((elo_max - elo_min) / (10 - RATING_FLOOR))
            + elo_min
        )

        # The floor bump (one K-value above elo_min) keeps a book from starting at the
        # literal Elo minimum, still in reach of the bottom, but not pinned to it.
        return max(elo, elo_min + RATING_FLOOR_BUMP)
