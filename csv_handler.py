import csv
import os
from datetime import datetime

from services.library_service import import_books
from ui import ERROR, PROMPT, SECONDARY, style


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

    Return a list of books imported (empty if import failed or no books were added) and
    a boolean indicating if the import was interrupted midway.
    """
    try:
        with open(filepath, newline="", encoding="utf-8") as file:
            reader = csv.DictReader(file)

            # Guard against empty CSV files with no headers
            if not reader.fieldnames:
                return [], False

            reader.fieldnames = [f.lower().strip() for f in reader.fieldnames]

            if "title" not in reader.fieldnames or "author" not in reader.fieldnames:
                print(f"{PROMPT}{style('ERROR! Missing required columns.', ERROR)}")
                return [], False

            result = import_books(reader, books)

    except FileNotFoundError:
        print(f"{PROMPT}{style('ERROR! Could not find file at:', ERROR)}")
        print(f"{PROMPT}{filepath}")
        return [], False

    for error in result.errors:
        print(f"{PROMPT}{style(error, ERROR)}")

    if result.skipped:
        plural = "s" if result.skipped > 1 else ""
        print(f"{PROMPT}Skipped {result.skipped} book{plural} already in the system.")

    return result.new_books, result.interrupted


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
