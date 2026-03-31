import random

from db.books_repo import update_elo as save_elo
from db.comparisons_repo import insert as insert_comparison
from services.scoring_service import (
    calculate_elo,
    confidence_score,
    opponent_weights,
    sampling_weight,
)


def select_opponents(books):
    """Select two books using weighted random selection.

    Favor low-confidence books (i.e., books with fewer unique matches played), books
    that have been matched against each other less often, and books with similar Elo
    scores, to maximize information gained from each match.
    """
    # Calculate weights based on confidence level.
    confidence_scores = {b.id: confidence_score(b, books) for b in books}

    weights = [sampling_weight(b, confidence_scores[b.id], books) for b in books]

    book_a = random.choices(books, weights=weights, k=1)[0]

    # Calculate weights for book_b candidates based on the selected book_a
    candidates = opponent_weights(book_a, confidence_scores, books)
    candidate_books = [b for b, w in candidates]
    candidate_weights = [w for b, w in candidates]

    book_b = random.choices(candidate_books, weights=candidate_weights, k=1)[0]

    return book_a, book_b


def resolve_comparison(winner, loser, books):
    """Update book records after a match is resolved.

    Update Elo scores, persist match, and update book opponents and wins.
    """

    new_winner_elo, new_loser_elo = calculate_elo(winner, loser, books)
    insert_comparison(winner.id, loser.id)

    winner.update_elo(new_winner_elo)
    winner.record_opponent(loser.id)
    winner.record_won_over(loser.id)
    save_elo(winner)

    loser.update_elo(new_loser_elo)
    loser.record_opponent(winner.id)
    save_elo(loser)
