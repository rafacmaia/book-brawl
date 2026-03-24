from models import Book

ABS_SCORE_WEIGHT = 0.30
LOC_SCORE_WEIGHT = 0.45
DEN_SCORE_WEIGHT = 0.25  # density-based stability score

LOC_LOWER_BOUND = 0.35
LOC_UPPER_BOUND = 0.65
ABS_MIN_OPPONENTS = 8
DENSITY_WINDOW = 26


# --- CONFIDENCE SCORE CALCULATIONS ---


def calculate_progress(books):
    """Return the average confidence score of all books."""
    if not books:
        return 0
    confidence_scores = [confidence_score(book, books) for book in books]
    return sum(confidence_scores) / len(confidence_scores)


def confidence_score(book, books):
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
    loc_score_weighted = local_score(book, books) * LOC_SCORE_WEIGHT

    # Density score boosts books with few neighbors with similar Elo, meaning
    # more stability. High density indicates a high chance of ranks shifting.
    den_score_weighted = stability_score(book, books) * DEN_SCORE_WEIGHT

    return abs_score_weighted + loc_score_weighted + den_score_weighted


def absolute_score(book, books):
    """Calculates a book's absolute score.

    Measures if a book has faced a minimum number of opponents, scaling with
    library size.
    """
    absolute_cap = (
        max(len(books) * 0.1, ABS_MIN_OPPONENTS)
        if len(books) > ABS_MIN_OPPONENTS
        else 1
    )

    return min(len(book.opponents) / absolute_cap, 1)


def local_score(book, books):
    """Calculates a book's local score.

    Measures how many opponents a book has faced that are similar to the book's Elo.
    """
    relevant_opponents = relevant_opp_faced = 0
    for opp in books:
        if (
            opp.id != book.id
            and LOC_LOWER_BOUND <= expected_score(book.elo, opp.elo) <= LOC_UPPER_BOUND
        ):
            relevant_opponents += 1
            if opp.id in book.opponents:
                relevant_opp_faced += 1

    return relevant_opp_faced / relevant_opponents if relevant_opponents else 1


def stability_score(book, books):
    """Calculates a book's stability score.

    Measures how many books have a close Elo to the book. High score density implies a
    higher chance for ranks to shift (i.e., lower stability in rankings).
    """
    tight_neighbors = sum(
        1
        for opp in books
        if opp.id != book.id and abs(book.elo - opp.elo) < DENSITY_WINDOW
    )

    upper_proximity = max(0, 1 - (Book.elo_max - book.elo) / DENSITY_WINDOW)
    lower_proximity = max(0, 1 - (book.elo - Book.elo_min) / DENSITY_WINDOW)
    edge_factor = 1 + max(upper_proximity, lower_proximity)

    density = min((tight_neighbors * edge_factor) / 10, 1)

    return 1 - density


# --- ELO SCORE CALCULATIONS ---


def calculate_elo(winner, loser, books):
    """Calculates each book's new Elo scores after a match."""
    expected_w = expected_score(winner.elo, loser.elo)
    expected_l = expected_score(loser.elo, winner.elo)
    new_winner_elo = round(winner.elo + get_k(winner, books) * (1 - expected_w))
    new_loser_elo = round(loser.elo + get_k(loser, books) * (0 - expected_l))

    return new_winner_elo, new_loser_elo


def expected_score(elo_a, elo_b):
    """Calculates the expected score of a book given the Elo of a potential opponent."""
    return 1 / (1 + 10 ** ((elo_b - elo_a) / 400))


def get_k(book, books):
    """Calculates and returns k value.

    Calculation is based on the percentage of unique opponents, i.e., confidence level.
    """
    if len(books) <= 1:
        return 40

    confidence = confidence_score(book, books)

    if confidence < 0.2:
        return 40
    elif confidence < 0.4:
        return 32
    elif confidence < 0.6:
        return 24
    elif confidence < 0.8:
        return 16
    else:
        return 10
