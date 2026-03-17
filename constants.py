from theme import ACCENT, ERROR, LINE_LENGTH, PRIMARY, PROMPT, SECONDARY
from utils import rule, style

BOOK_LIMIT = 250
BACKUPS_LIMIT = 5

QUIT_OPTION = "5"

INITIAL_BATCH_SIZE = 50
BATCH_SIZE = 50

# --- Informational constants

TEST_MESSAGE = (
    f"{' ' * (LINE_LENGTH // 2 - 13)}\033[1;31m⚠️ RUNNING IN TEST MODE ⚠️\033[1;0m"
)

EMPTY_LIBRARY = (
    " Your library is empty!\n"
    " To get started, please provide the path to a CSV file of your book log.\n"
    " It should have the following columns:"
    "\033[33m title\033[0m,\033[33m author\033[0m, \033[33m rating\033[0m.\n"
)

CONFIDENCE_TIERS = (
    f"{style(' Confidence Tiers ', 'bold' + ACCENT)}{rule(LINE_LENGTH - 18, 'blue')}"
    f"""
    🔴 Very Low   — Early data, ranking mostly based on initial rating
    🟠 Low        — Some data, broad tier is likely correct (top/mid/bottom)
    🟡 Moderate   — General position is fairly reliable, exact rank still shifting
    🟢 High       — Position is well established, likely within ~5 spots
    ✅  Very High  — Locked in, unlikely to shift significantly"""
    f"\n {rule(LINE_LENGTH - 1, 'blue')}"
)

ARENA_OPTIONS = ["1", "2", "u", "b", "q"]

LIMIT_REACHED = (
    f"\033[31m Sorry, you read way too much "
    f"and reached the limit of {BOOK_LIMIT} books.\n"
    f" I can't handle any more 😭.\033[0m"
)

EMPTY_IMPORT = (
    f"{PROMPT}"
    f"{style('No books imported. Please check your file and try again.', ERROR)}"
)

IMPORT_INTERRUPTED = (
    f"{PROMPT}{style('Warning:', ERROR)}"
    f" Book limit reached during import, not all books were added."
)

LIMIT_WARNING = (
    f"{PROMPT}{style('Warning:', ERROR)}"
    f" Book limit reached, no more books can be added!"
)

GOODBYE = (
    f"{rule((LINE_LENGTH // 2 - 16), PRIMARY)}"
    f"{style(' 📚 Goodbye! Keep on reading 📚 ', PRIMARY)}"
    f"{rule((LINE_LENGTH // 2 - 16), PRIMARY)}"
)


# --- Header constants


TITLE = (
    f"{rule((LINE_LENGTH // 2 - 8), PRIMARY)}"
    f"{style('  BOOK RANKER  ', PRIMARY)}"
    f"{rule((LINE_LENGTH // 2 - 7), PRIMARY)}"
)

MAIN_MENU = f""" {style("MAIN MENU", SECONDARY)} {rule(LINE_LENGTH - 11, SECONDARY)}
 1. Play
 2. View Rankings
 3. Import New Books
 4. Export Rankings
 5. Quit"""

ARENA_HEADER = f"""
 {style("BOOK ARENA", SECONDARY)} {rule(LINE_LENGTH - 12, SECONDARY)}
 Let's rank some books!
 Books will face-off in random matches to craft the ultimate book ranking.
 Options:
   {style("1", SECONDARY)} → Select book #1
   {style("2", SECONDARY)} → Select book #2
   {style("u", SECONDARY)} → Undo previous match
   {style("b", SECONDARY)} → Back to main menu
   {style("q", SECONDARY)} → Quit program

 {style("Let's get started! (press Enter) ", SECONDARY)}"""

RANKINGS_HEADER = (
    f"{style(' CURRENT RANKINGS ', SECONDARY)}{rule(LINE_LENGTH - 18, SECONDARY)}"
)

IMPORT_HEADER = (
    f"{style(' IMPORT NEW BOOKS ', SECONDARY)}{rule(LINE_LENGTH - 18, SECONDARY)}"
)

EXPORT_HEADER = (
    f"{style(' EXPORT RANKINGS ', SECONDARY)}{rule(LINE_LENGTH - 17, SECONDARY)}"
)
