from dataclasses import dataclass, field

from config import BOOK_LIMIT
from db.books_repo import get_elo_range, insert, insert_many
from models import Book
from services.scoring_service import K_TIERS

ELO_DEFAULT = 1040
ELO_MIN_DEFAULT = 800
ELO_MAX_DEFAULT = 1200


RATING_FLOOR = 3
RATING_FLOOR_BUMP = K_TIERS[0][1]  # One initial K-value above the floor


@dataclass
class ImportResult:
    new_books: list
    skipped: int
    interrupted: bool
    errors: list[str] = field(default_factory=list)


@dataclass
class BookData:
    title: str
    author: str
    rating: float | None = None


def import_books(reader_id, file_reader, books):
    """Process each row of the CSV, adding new books to the database.

    Validates each row, skipping duplicate and invalid entries.
    """
    existing_books = {(b.title.lower(), b.author.lower()) for b in books}

    elo_range = get_elo_range(reader_id) or {
        "elo_min": ELO_MIN_DEFAULT,
        "elo_max": ELO_MAX_DEFAULT,
    }

    result = ImportResult(new_books=[], skipped=0, interrupted=False)

    for i, row in enumerate(file_reader, start=2):
        if len(books) + len(result.new_books) >= BOOK_LIMIT:
            result.interrupted = True
            return result

        book_data = _process_row(row, i, existing_books, result)
        if book_data:
            # 'books' only updates after the full import, so len(books) == 0 stays True
            # for every row in a first-time import
            elo = rating_to_elo(reader_id, elo_range, book_data.rating)
            book = Book(book_data.title, book_data.author, book_data.rating, elo)
            result.new_books.append(book)
            existing_books.add((book_data.title.lower(), book_data.author.lower()))

    try:
        insert_many(reader_id, result.new_books)
    except Exception as e:
        result.errors.append(f"Database error during import: {str(e)}")
        result.interrupted = True
        result.new_books = []

    return result


def _process_row(row, i, existing_books, result):
    """Validate and process a single CSV row, updating the import result in place."""
    title = (row.get("title") or "").strip()
    author = (row.get("author") or "").strip()
    raw_rating = (row.get("rating") or "").strip()

    if not (title or author):
        return None

    if not (title and author):
        author_clause = f" by '{author}'" if author else ""
        result.errors.append(
            f"Skipped row {i}: '{title if title else '  '}'"
            f"{author_clause} – missing {'title' if not title else 'author'}"
        )
        return None

    if not raw_rating:
        rating = None
    else:
        try:
            rating = float(raw_rating)
            if not (1 <= rating <= 10):
                raise ValueError
        except ValueError:
            result.errors.append(
                f"Skipped row {i}: '{title}' by '{author}' – invalid rating: '{raw_rating}'"
            )
            return None

    if (title.lower(), author.lower()) in existing_books:
        result.skipped += 1
        return None
    else:
        return BookData(title, author, rating)


def rating_to_elo(reader_id, elo_range, rating):
    """Convert a user rating, or lack of, to an Elo score."""
    if rating is None:
        return ELO_DEFAULT

    elo_min = elo_range["elo_min"]
    elo_max = elo_range["elo_max"]

    if elo_min == ELO_MIN_DEFAULT and elo_max == ELO_MAX_DEFAULT:
        # Map rating to the starting 800-1200 Elo range
        elo = ELO_MIN_DEFAULT + (rating - 1) * ((ELO_MAX_DEFAULT - ELO_MIN_DEFAULT) / 9)
        return round(elo)
    else:
        # Maps rating to Elo using a floor of 3 rather than 1, reflecting that
        # real-world ratings rarely fall below 3/10. The floor bump ensures a book
        # rated at the floor doesn't start at the literal Elo minimum — it begins one
        # K-value above, within reach of the bottom but not pinned there.
        rating = max(RATING_FLOOR, rating)
        elo = round(elo_min + (rating - 3) * ((elo_max - elo_min) / 7))
        return max(elo, elo_min + RATING_FLOOR_BUMP)
