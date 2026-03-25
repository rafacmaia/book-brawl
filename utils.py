import textwrap

from constants import PROGRESS_LABELS, SUMMARY_LABELS
from theme import ERROR, LINE_LENGTH, PRIMARY, PROMPT, SECONDARY

# ====== STYLING


def style(text, styling=None):
    """Apply ANSI styling to the provided text."""
    code = _ansi(styling)

    if not code:
        return text

    return code + str(text) + "\033[0m"


def rule(length, styling=None, symbol="─"):
    """Return a horizontal rule with the provided styling."""
    code = _ansi(styling)
    if not code:
        return symbol * length

    return code + (symbol * length) + "\033[0m"


def _ansi(styling=None):
    """Return ANSI escape codes for the provided styling."""
    if not styling:
        return ""

    sections = []

    if "bold" in styling:
        sections.append("1")
    if "dim" in styling:
        sections.append("2")
    if "italic" in styling:
        sections.append("3")
    if "underline" in styling:
        sections.append("4")

    if "red" in styling:
        sections.append("31")
    elif "green" in styling:
        sections.append("32")
    elif "yellow" in styling:
        sections.append("33")
    elif "blue" in styling:
        sections.append("94")
    elif "magenta" in styling:
        sections.append("35")
    elif "cyan" in styling:
        sections.append("36")
    elif "white" in styling:
        sections.append("37")

    if not sections:
        return ""

    return "\033[" + ";".join(sections) + "m"


# ====== FORMATTING


def header(title, color=SECONDARY, new_line=False):
    """Return a formatted header with the provided title and styling."""
    next_line = "\n" if new_line else ""
    text = style(title, "bold" + color)
    divider = rule(LINE_LENGTH - len(title) - 2, color)

    return f"{next_line} {text} {divider}"


def format_book(book, width=LINE_LENGTH - 7):
    return textwrap.fill(str(book), width=width, subsequent_indent="\t")


# ====== INPUT HELPERS


def prompt(p=PROMPT, options=None, error_message=None):
    """Prompt the user for input and validates it.

    Uses the provided list of options to validate the input."""
    if not options:
        options = ("y", "n")
    if not error_message:
        error_message = f"Nope, please try: {', '.join(options)}"

    while True:
        choice = input(f"{p}").strip().lower()
        if choice in options:
            return choice
        print(f"{PROMPT}{style(error_message, ERROR)}")


def press_enter(message="Press Enter for the main menu... ", new_line=True):
    """Pause the program and prompt the user to press Enter."""
    print() if new_line else None
    input(f"{PROMPT}{style(message, SECONDARY)}")


# ====== DOMAIN HELPERS


def library_summary(b_count, pct, color=PRIMARY):
    """Return a summary of the user's library: book count and progress bar & label."""
    plural = "s" if b_count > 1 else ""
    count = f" Your library:     {style(f'{b_count} Book{plural}', color)}"
    progress = f"\n Current progress: {style(progress_bar(pct, 20), color)}\n\033[3m"
    label = next(label for threshold, label in SUMMARY_LABELS if pct <= threshold)

    return count + progress + label + "\033[0m"


def progress_bar(pct, width=20):
    """Return a progress bar with the provided percentage and width."""
    filled_section = round(pct * width)
    empty_section = width - filled_section

    bar = "█" * filled_section + "░" * empty_section

    pct_str = f"{pct * 100:3.0f}%"

    label = next(label for threshold, label in PROGRESS_LABELS if pct <= threshold)

    return f"{bar} {pct_str}  {label}"
