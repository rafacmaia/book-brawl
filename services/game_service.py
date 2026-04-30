import math
import random

from db.books_repo import get_all_history
from db.books_repo import update_elo as save_elo
from db.comparisons_repo import insert as insert_comparison
from models import Book
from services.scoring_service import (
    ABS_PERCENTAGE,
    LOCAL_WINDOW,
    absolute_score,
    calculate_elo,
    confidence_score,
)

# Calculate the Elo-score gap to prioritize in matchmaking,
# informed by the LOCAL_WINDOW used in the measure of confidence
ELO_GAP = 400 * math.log10(1 / (0.5 - LOCAL_WINDOW) - 1)


class NotEnoughBooksError(Exception):
    """Raised when there are not enough books to select opponents."""

    pass


def select_opponents(reader_id: int) -> tuple[Book, Book]:
    """Select two books using weighted random selection.

    Favor low-confidence books (i.e., books with fewer unique matches played), books
    that have been matched against each other less often, and books with similar Elo
    scores, to maximize information gained from each match.
    """
    books = get_all_history(reader_id)
    if len(books) < 2:
        raise NotEnoughBooksError

    # Calculate confidence scores for all books
    confidence_scores = {b.id: confidence_score(b, books) for b in books}

    # Calculate weights based on confidence scores
    weights = [_sampling_weight(b, confidence_scores[b.id], books) for b in books]

    book_a = random.choices(books, weights=weights, k=1)[0]

    # Calculate weights for book_b candidates based on the selected book_a
    candidates = _opponent_weights(book_a, confidence_scores, books)
    candidate_books = [b for b, w in candidates]
    candidate_weights = [w for b, w in candidates]

    book_b = random.choices(candidate_books, weights=candidate_weights, k=1)[0]

    return book_a, book_b


def _sampling_weight(book: Book, b_confidence: float, books: list[Book]) -> float:
    """Calculate selection weight based on confidence level and absolute_score.

    Ensures a minimum weight of 0.1. Absolute_score is used to highly prioritize newer
    book entries with very few matches.
    """
    if len(books) <= 1:
        return 1

    # Boost scales with library size and absolute_score: larger collections
    # require higher boosts to make a difference, and lower absolute_score
    # requires a higher boost to get early data in.
    early_boost = (len(books) * ABS_PERCENTAGE) * (1 - absolute_score(book, books))
    confidence_weight = 1 - b_confidence

    return max(0.1, confidence_weight, early_boost)


def _opponent_weights(
    book_a: Book, con_scores: dict[int, float], books: list[Book]
) -> list[tuple[Book, float]]:
    """Adjust weights for book_b selection based on the selected book_a.

    Prioritize rarer pairings and books with similar Elo scores.
    """
    candidates = []
    for b in books:
        if b.id != book_a.id:
            # Increase the multiplier to penalize rematches more
            rematch_penalty = 1 + 4 * book_a.faced_opponents.get(b.id, 0)

            # Decrease the divisor to prioritize similar score ranges
            elo_gap_penalty = 1 + abs(book_a.elo - b.elo) / ELO_GAP

            # Calculate the base weight based on confidence level
            base_weight = max(0.05, 1 - con_scores[b.id])

            adjusted_weight = base_weight / rematch_penalty / elo_gap_penalty

            candidates.append((b, adjusted_weight))

    return candidates


def resolve_comparison(
    reader_id: int, winner_id: int, loser_id: int
) -> tuple[Book, Book]:
    """Update book records after a match is resolved.

    Update Elo scores, persist match, and update book opponents and wins.
    """
    books = get_all_history(reader_id)
    book_map = {b.id: b for b in books}

    winner: Book | None = book_map.get(winner_id)
    loser: Book | None = book_map.get(loser_id)

    if winner is None or loser is None:
        raise ValueError

    new_winner_elo, new_loser_elo = calculate_elo(winner, loser, books)
    insert_comparison(reader_id, winner.id, loser.id)

    winner.update_elo(new_winner_elo)
    winner.record_opponent(loser.id)
    winner.record_won_over(loser.id)
    save_elo(winner)

    loser.update_elo(new_loser_elo)
    loser.record_opponent(winner.id)
    save_elo(loser)

    return winner, loser
