from config import ACCURACY_TIERS
from db.books_repo import get_all_history
from services.scoring_service import confidence_score


def build_leaderboard(reader_id):
    """Return a list of (rank, book) tuples."""
    books = get_all_history(reader_id)

    ranked_books = []

    for rank, book in _rank_books(books):
        accuracy_score = confidence_score(book, books)

        accuracy_tier = len(ACCURACY_TIERS)
        for index, threshold in enumerate(ACCURACY_TIERS, start=1):
            if accuracy_score < threshold:
                accuracy_tier = index
                break

        ranked_books.append(
            {
                "rank": rank,
                "title": book.title,
                "author": book.author,
                "accuracy_score": round(accuracy_score, 4),
                "accuracy_tier": accuracy_tier,
            }
        )

    return ranked_books


def _rank_books(books):
    """Rank all books based on their Elo score.

    Ties are broken by head-to-head comparisons (i.e., number of wins against other
    tied books), then by initial user rating.
    """
    elo_sort = sorted(books, key=lambda b: b.elo, reverse=True)

    ranked = []
    i = 0
    rank = 0
    while i < len(elo_sort):
        tied_group = [elo_sort[i]]
        while i + 1 < len(elo_sort) and elo_sort[i + 1].elo == elo_sort[i].elo:
            i += 1
            tied_group.append(elo_sort[i])

        rank += 1

        if len(tied_group) == 1:
            ranked.append((rank, tied_group[0]))
        else:
            ranked.extend(_tiebreak(tied_group, rank))

        rank += len(tied_group) - 1
        i += 1

    return ranked


def _tiebreak(tied_group, rank):
    """Sort a tied group by head-to-head wins, then initial user rating"""
    tiebreak_scores = {b.id: _head_to_head_score(b, tied_group) for b in tied_group}
    tied_group.sort(
        key=lambda b: (tiebreak_scores[b.id], b.rating if b.rating else 0), reverse=True
    )

    ranked = []
    current_rank = rank
    for j, book in enumerate(tied_group):
        tied_to_next = (
            j < len(tied_group) - 1
            and tiebreak_scores[tied_group[j + 1].id] == tiebreak_scores[book.id]
            and book.rating == tied_group[j + 1].rating
        )

        ranked.append((current_rank, book))

        if not tied_to_next:
            current_rank += 1

    return ranked


def _head_to_head_score(book, tied_books):
    tied_opponents = {b.id for b in tied_books if b.id != book.id}
    wins = sum(book.won_over.get(opp_id, 0) for opp_id in tied_opponents)
    return wins
