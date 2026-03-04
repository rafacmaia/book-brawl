import os
import shutil
import sys
from datetime import datetime

import state
from csv_handler import export_to_csv, csv_reader
from db import init_db
from display import (
    view_rankings,
    progress_bar,
    prompt,
    MAIN_MENU,
    LINE_LENGTH,
    TEST_MESSAGE,
    MENU_OPTIONS,
    PROMPT,
)
from game import run_game
from models import Book
from ranking import calculate_rankings_confidence


def startup():
    """Print the startup message and display the main menu.

    If no books are in the system, prompt the user to import from a CSV.
    """
    os.system("cls" if os.name == "nt" else "clear")
    print(
        f"\n\033[1;32m{'–' * (LINE_LENGTH // 2 - 7)} "
        f"BOOK RANKER "
        f"{'–' * (LINE_LENGTH // 2 - 6)}\033[0m"
    )

    # Warn if running in test mode, which uses a separate test database
    if state.db_path == "data/test.db":
        print(TEST_MESSAGE)

    # First run, no books in the system - prompt for CSV import
    if not state.books:
        print(
            " Your library is empty!\n"
            " To get started, please provide the path to a CSV file of your book log.\n"
            " It should have the following columns: \033[33mtitle\033[0m, \033[33mauthor\033[0m, \033[33mrating\033[0m.\n"
        )
        if csv_reader(prompt=" CSV file path (q to quit): ", options=["q"]) == "q":
            quit_game()
        state.books = Book.load_all()
    else:
        calculate_rankings_confidence()

    main_menu()


def main_menu():
    """Display the main menu and handle user input."""
    while True:
        rankings_progress = (
            f" CONFIDENCE: {progress_bar(state.rankings_confidence, 20)} "
        )
        padding = (LINE_LENGTH - len(rankings_progress) - 1) // 2
        print(f" \033[1;33m{'–' * padding}{rankings_progress}{'–' * padding}\033[0m")

        print(MAIN_MENU)

        if state.db_path == "data/test.db":
            print(TEST_MESSAGE)

        print()
        choice = prompt(
            {"1", "2", "2 -v", "3", "4", MENU_OPTIONS},
            f"Invalid choice, I can only read options 1-{MENU_OPTIONS}.",
        )
        next_action = ""

        if choice == "1":
            next_action = run_game()
            calculate_rankings_confidence()
        elif choice in ("2", "2 -v"):
            next_action = view_rankings("-v" in choice)
        elif choice == "3":
            add_books()
            calculate_rankings_confidence()
        elif choice == "4":
            export_rankings()
        elif choice == MENU_OPTIONS:
            quit_game()

        if next_action == "q":
            quit_game()
        if next_action == "e":
            export_rankings()

        print()


def add_books():
    print()
    print(f"\033[1;34m IMPORT NEW BOOKS {'–' * (LINE_LENGTH - 18)}\033[1;0m")

    if len(state.books) >= state.BOOK_LIMIT:
        print(
            f"\033[31m Sorry, you read way too much "
            f"and reached the limit of {state.BOOK_LIMIT} books.\n"
            f" I can't handle any more 😭.\033[0m"
        )
        return
    print(" Please provide the path to your CSV book log to sync new books.")
    print()

    response = csv_reader(prompt=" CSV file path (b to go back): ", options=["b"])
    if response == "b":
        return
    added, interrupted = response

    if added > 0:
        plural = "s" if added > 1 else ""
        print(f"{PROMPT}Imported {added} book{plural}!")
        state.books = Book.load_all()
    else:
        print(
            f"{PROMPT}\033[31mNo books imported. "
            "Please check your file and try again.\033[0m "
        )

    if interrupted:
        print(
            f"{PROMPT}\033[31mWarning: \033[0mBook limit reached during import, "
            "not all books were added."
        )
    elif len(state.books) >= state.BOOK_LIMIT:
        print(
            f"{PROMPT}\033[31mWarning: \033[0mBook limit reached, no more books can be added!"
        )


def export_rankings():
    print()
    print(f"\033[1;34m EXPORT RANKINGS {'–' * (LINE_LENGTH - 17)}\033[1;0m")
    print(
        f" Current progress: "
        f"\033[1;32m{progress_bar(state.rankings_confidence, 20)}\033[0m"
    )

    if state.rankings_confidence < 0.2:
        print(" Not much data yet, ranking mostly based on initial ratings.")
    elif state.rankings_confidence < 0.4:
        print(" Still early stages, but broad tiers (top/mid/bottom) likely correct.")
    elif state.rankings_confidence < 0.6:
        print(" General positions are fairly reliable, exact ranks still shifting.")
    elif state.rankings_confidence < 0.8:
        print(" Positions are well established, likely within ~10 spots.")
    elif state.rankings_confidence < 0.95:
        print(" Rankings are locked in, unlikely to shift significantly.")
    else:
        print(" Absolute ranking of all books established. Export with confidence!")

    print()
    print(f" \033[33mProceed with export (y/n)?\033[0m")
    choice = prompt({"y", "n"}, "Sorry, I can only understand 'y' or 'n'.")

    if choice == "y":
        export_to_csv()


# --- QUITTING AND BACKUPS  ---


def quit_game():
    if state.books:
        backup_db()
        backup_cleanup()
    print()
    print(
        f"\033[1;32m{'–' * (LINE_LENGTH // 2 - 16)}"
        f" 📚 Goodbye! Keep on reading 📚 "
        f"{'–' * (LINE_LENGTH // 2 - 16)}\033[0m"
    )
    print()
    sys.exit()


def backup_db():
    backup_dir = "backup"
    os.makedirs(backup_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    backup_path = os.path.join(backup_dir, f"backup_{timestamp}.db")

    shutil.copy(state.db_path, backup_path)


def backup_cleanup():
    """Only keep the last N backups."""
    backup_dir = "backup"
    backups = sorted(os.listdir(backup_dir))
    for old in backups[: -state.BACKUPS_LIMIT]:
        os.remove(os.path.join(backup_dir, old))


if __name__ == "__main__":
    if "--test" in sys.argv:
        state.db_path = "data/test.db"
    if "--debug" in sys.argv:
        state.debug = True

    init_db()
    state.books = Book.load_all()
    startup()
