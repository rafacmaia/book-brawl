from dataclasses import dataclass, field

from constants import BOOK_LIMIT, DEFAULT_RATING
from db.books_repo import insert
from models import Book


@dataclass
class ImportResult:
    new_books: list
    skipped: int
    interrupted: bool
    errors: list[str] = field(default_factory=list)


def import_books(reader, books):
    """Process each row of the CSV, adding new books to the database.

    Validates each row, skipping duplicate and invalid entries.
    """
    existing_books = {(b.title.lower(), b.author.lower()) for b in books}

    result = ImportResult(new_books=[], skipped=0, interrupted=False)

    for i, row in enumerate(reader, start=2):
        if len(books) + len(result.new_books) >= BOOK_LIMIT:
            result.interrupted = True
            return result

        _process_row(row, i, existing_books, result)

    return result


def _process_row(row, i, existing_books, result):
    """Validate and process a single CSV row, updating the import result in place."""
    title = (row.get("title") or "").strip()
    author = (row.get("author") or "").strip()
    raw_rating = (row.get("rating") or "").strip()

    if not (title or author):
        return

    if not (title and author):
        result.errors.append(
            f"Skipped row {i}: '{title if title else '  '}'"
            f"{f" by '{author}'" if author else ''}"
            f" – missing {'title' if not title else 'author'}"
        )
        return

    try:
        rating = float(raw_rating) if raw_rating else DEFAULT_RATING
        if not 0 <= rating <= 10:
            raise ValueError
    except ValueError:
        result.errors.append(
            f"Skipped row {i}: '{title}' by '{author}' – invalid rating: '{raw_rating}'"
        )
        return

    if (title.lower(), author.lower()) in existing_books:
        result.skipped += 1
    else:
        book = Book(title, author, rating)
        insert(book)
        result.new_books.append(book)
        existing_books.add((title.lower(), author.lower()))
