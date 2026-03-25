import csv
import os
from datetime import datetime

from constants import BOOK_LIMIT, DEFAULT_RATING
from db.books_repo import insert
from models import Book
from theme import ERROR, PROMPT, SECONDARY
from utils import style

# ====== CSV IMPORT


def csv_reader(prompt=" CSV file path: ", back_key="q"):
    """Prompt the user for a CSV file path."""
    print(prompt)
    while True:
        filepath = input(PROMPT).strip()
        if filepath == back_key:
            return filepath

        if not (filepath and os.path.exists(filepath)):
            print(f"{PROMPT}{style('Invalid path. Please try again.', ERROR)}")
            continue

        if not filepath.endswith(".csv"):
            error_message = (
                "That doesn't look like a CSV. "
                "Please provide the full path to a CSV file."
            )
            print(f"{PROMPT}{style(error_message, ERROR)}")
            continue

        return filepath


def import_from_csv(filepath, books):
    """Import books from a CSV, skipping any already in the system.

    Return a list of books imported and a boolean indicating if the import was
    interrupted.
    """
    new_books = []
    interrupted = False
    try:
        with open(filepath, newline="", encoding="utf-8") as file:
            reader = csv.DictReader(file)

            # Guard against empty CSV files with no headers
            if not reader.fieldnames:
                return new_books, interrupted

            reader.fieldnames = [field.lower().strip() for field in reader.fieldnames]
            new_books, interrupted = _process_rows(
                reader, new_books, interrupted, books
            )

    except FileNotFoundError:
        print(f"{PROMPT}{style("ERROR! Couldn't find file at:", ERROR)}")
        print(f"{PROMPT}{filepath}")
        interrupted = True
        return new_books, interrupted
    except KeyError as e:
        print(
            f"{PROMPT}{style('ERROR! Missing column', ERROR)}"
            f" {style(e, SECONDARY)} {style('in CSV file.', ERROR)}"
        )
        interrupted = True
        return new_books, interrupted

    return new_books, interrupted


def _process_rows(reader, new_books, interrupted, books):
    """Process each row of the CSV, adding new books to the database.

    Validates each row, skipping duplicate and invalid entries.
    """
    existing_books = {(b.title.lower(), b.author.lower()) for b in books}
    skipped_rows = 0

    for i, row in enumerate(reader, start=2):
        if len(books) + len(new_books) >= BOOK_LIMIT:
            interrupted = True
            return new_books, interrupted

        title = row["title"].strip()
        author = row["author"].strip()
        raw_rating = (row.get("rating") or "").strip()

        if not (title or author):
            continue
        if not (title and author):
            missing_field = "title" if not title else "author"
            print(
                PROMPT,
                style(
                    f"Skipped row {i}: '{title if title else '  '}'"
                    f"{f" by '{author}'" if author else ''} – missing {missing_field}",
                    ERROR,
                ),
                sep="",
            )
            continue

        try:
            rating = float(raw_rating) if raw_rating else DEFAULT_RATING
            if not 0 <= rating <= 10:
                raise ValueError
        except ValueError:
            print(
                PROMPT,
                style(
                    f"Skipped '{title}' by '{author}' – invalid rating: '{raw_rating}'",
                    ERROR,
                ),
                sep="",
            )
            continue

        if (title.lower(), author.lower()) not in existing_books:
            book = Book(title, author, rating)
            insert(book)
            new_books.append(book)
            existing_books.add((title.lower(), author.lower()))
        else:
            skipped_rows += 1

    if skipped_rows:
        print(
            f"{PROMPT}"
            f"Skipped {skipped_rows} book{'s' if skipped_rows > 1 else ''}"
            f" already in the system.",
        )

    return new_books, interrupted


# ====== CSV EXPORT


def export_to_csv(books):
    """Export all books with their current rankings, as a CSV file."""
    exports_dir = "exports"
    os.makedirs(exports_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%d")
    filepath = os.path.join(exports_dir, f"book_brawl_{timestamp}.csv")

    # Check if the file already exists, if so, append a number to the end
    if os.path.exists(filepath):
        base = filepath.replace(".csv", "")
        counter = 2
        while os.path.exists(filepath):
            filepath = f"{base}_{counter}.csv"
            counter += 1

    ranked_books = sorted(books, key=lambda b: b.elo, reverse=True)

    with open(filepath, "w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["Rank", "Title", "Author", "Rating"])
        for i, book in enumerate(ranked_books, start=1):
            writer.writerow([i, book.title, book.author, book.rating])

    print(f"{PROMPT}✓ Leaderboard exported to: {style(filepath, 'green')}")
