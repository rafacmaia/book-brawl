"""Confidence scoring and Elo calculations.

A book's confidence score reflects how trustworthy its current rank is. It feeds
two parts of the system:

  - K-factor selection in the Elo update (lower confidence -> larger K -> faster
    movement until the rank settles).
  - Overall progress display (the average across all books is shown to the user).

The score is a weighted combination of three components, each capturing a
different aspect of rank accuracy:

  absolute_score (30%)  Has this book had enough matches at all? Scales gently
                        with library size so larger libraries don't demand
                        proportionally more matches per book.

  local_score (45%)     Of the opponents that meaningfully threaten this book's rank
                        (similar Elo), how many has it actually faced? This is a measure
                        of coverage; books need to face their real competition, not just
                        any opponents.

  stability_score (25%) How densely packed is this book's neighborhood? A book in a
                        tight cluster of similar-Elo books has a more fragile rank than
                        one in a sparse region, regardless of match history.

Local has the highest weight because facing relevant opponents is the strongest signal
of meaningful placement. Stability has the lowest weight because it measures inherent
ambiguity rather than something the user can resolve through more matches; it's a damper
on overconfidence, not a primary driver.
"""

import math

from models import Book

ABS_SCORE_WEIGHT = 0.30  # absolute score weight
LOC_SCORE_WEIGHT = 0.45  # local score weight
STA_SCORE_WEIGHT = 0.25  # density-based stability score weight

ABS_BASE = 5

LOCAL_WINDOW = 0.12

DENSITY_WINDOW = 16
DENSITY_CAP = 10

K_TIERS = [(0.25, 40), (0.5, 32), (0.75, 24), (0.9, 16), (1.0, 8)]


# ====== CONFIDENCE SCORING

if not math.isclose(ABS_SCORE_WEIGHT + LOC_SCORE_WEIGHT + STA_SCORE_WEIGHT, 1):
    raise ValueError(
        "Score weights must sum to 1.0, got "
        f"{ABS_SCORE_WEIGHT + LOC_SCORE_WEIGHT + STA_SCORE_WEIGHT}"
    )


def calculate_progress(books: list[Book]) -> float:
    """Return the average confidence score of all books."""
    if not books:
        return 0

    confidence_scores = [confidence_score(book, books) for book in books]

    return sum(confidence_scores) / len(confidence_scores)


def confidence_score(book: Book, books: list[Book]) -> float:
    """Return a confidence score indicating the certainty of a book's ranking.

    Use a weighted combination of the number of opponents faced, number of faced
    opponents with similar score, and local density in overall rankings to account
    for, respectively, overall confidence, local confidence, and stability.
    """
    if len(books) < 1:
        return 0
    if len(books) == 1:
        return 1

    # Absolute score boosts the first batch of matches to speed overall placement.
    abs_score_weighted = absolute_score(book, books) * ABS_SCORE_WEIGHT

    # Local score boosts matches against books with similar Elo to refine placement.
    loc_score_weighted = _local_score(book, books) * LOC_SCORE_WEIGHT

    # Stability score boosts books with few neighbors with similar Elo, meaning
    # more stability. High density indicates a high chance of ranks shifting.
    sta_score_weighted = _stability_score(book, books) * STA_SCORE_WEIGHT

    return abs_score_weighted + loc_score_weighted + sta_score_weighted


def absolute_score(book: Book, books: list[Book]) -> float:
    """Calculates a book's absolute score.

    Measures whether a book has faced enough opponents to claim general placement.
    The cap grows with library size but sublinearly, so larger libraries don't demand
    an unrealistically large number of matches per book.
    """
    if len(books) <= 1:
        return 1

    # Cap grows with sqrt(library_size) so a 100-book library asks for ~10 matches,
    # a 500-book library asks for ~22 matches, with ABS_BASE acting as a floor for small
    # libraries.
    target_opponents_cap = max(math.sqrt(len(books)), ABS_BASE)
    opponents_cap = min(target_opponents_cap, len(books) - 1)

    return min(len(book.faced_opponents) / opponents_cap, 1)


def _local_score(book: Book, books: list[Book]) -> float:
    """Calculates a book's local score.

    Measures how many opponents a book has faced that are similar to the book's Elo.
    Uses additive smoothing to avoid harsh penalties when few similar opponents exist.
    """
    relevant_opps = relevant_opps_faced = 0

    for opp in books:
        if (
            opp.id != book.id
            and abs(_expected_score(book.elo, opp.elo) - 0.5) <= LOCAL_WINDOW
        ):
            relevant_opps += 1
            if opp.id in book.faced_opponents:
                relevant_opps_faced += 1

    # Use additive smoothing to avoid harsh penalties when relevant_opponents is small.
    # With few threats, we trust the prior more; with many, the raw ratio dominates.
    smoothing = 9

    return (relevant_opps_faced + smoothing) / (relevant_opps + smoothing)


def _stability_score(book: Book, books: list[Book]) -> float:
    """Calculates a book's stability score.

    Measures how many books have a close Elo to the book. High score density implies a
    higher chance for ranks to shift (i.e., lower stability in rankings).
    """
    tight_neighbors = sum(
        1
        for opp in books
        if opp.id != book.id and abs(book.elo - opp.elo) <= DENSITY_WINDOW
    )

    max_neighbors = min(len(books) - 1, DENSITY_CAP)

    density = min(tight_neighbors / max_neighbors, 1)

    return 1 - density


# ====== ELO CALCULATION


def calculate_elo(winner: Book, loser: Book, books: list[Book]) -> tuple[int, int]:
    """Calculates each book's new Elo scores after a match."""
    expected_w = _expected_score(winner.elo, loser.elo)
    expected_l = _expected_score(loser.elo, winner.elo)
    new_winner_elo = round(winner.elo + _get_k(winner, books) * (1 - expected_w))
    new_loser_elo = round(loser.elo + _get_k(loser, books) * (0 - expected_l))

    return new_winner_elo, new_loser_elo


def _expected_score(book_elo: int, opponent_elo: int) -> float:
    """Calculates the probability that a book wins against a given opponent.

    Returns a value between 0 (very unlikely to win) and 1 (very likely winner).
    """
    return 1 / (1 + 10 ** ((opponent_elo - book_elo) / 400))


def _get_k(book: Book, books: list[Book]) -> int:
    """Calculates and returns k value.

    Calculation is based on the percentage of unique opponents, i.e., confidence level.
    """
    if len(books) <= 1:
        return K_TIERS[0][1]

    confidence = confidence_score(book, books)

    k = next(k for threshold, k in K_TIERS if confidence <= threshold)

    # If the book has an initial rating and is in the lowest confidence tier, give it a
    # boost to the next tier as broad positioning is likely already established.
    if (book.rating is not None) and (k == K_TIERS[0][1]):
        return K_TIERS[1][1]

    return k
