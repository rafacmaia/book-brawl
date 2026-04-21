class BookDraft:
    def __init__(
        self, title: str, author: str, elo: int, rating: float | None = None
    ) -> None:
        self.title = title
        self.author = author
        self.elo = elo
        self.rating = rating


class Book:
    elo_min = 800
    elo_max = 1200

    def __init__(
        self,
        book_id: int,
        title: str,
        author: str,
        elo: int,
        rating: float | None = None,
    ) -> None:
        self.id = book_id
        self.title = title
        self.author = author
        self.elo = elo
        self.rating = rating
        self.faced_opponents = {}  # {opp_id: times_matched} - used in confidence scoring
        self.won_over = {}  # {opp_id: times_won_over} - used for tiebreaking

    def update_elo(self, new_elo: int) -> None:
        """Update the Elo score for this book and update the global min/max."""
        self.elo = new_elo

        if self.elo < Book.elo_min:
            Book.elo_min = self.elo
        if self.elo > Book.elo_max:
            Book.elo_max = self.elo

    def record_opponent(self, opponent_id: int) -> None:
        self.faced_opponents[opponent_id] = self.faced_opponents.get(opponent_id, 0) + 1

    def record_won_over(self, opponent_id: int) -> None:
        self.won_over[opponent_id] = self.won_over.get(opponent_id, 0) + 1

    def __repr__(self) -> str:
        return f"{self.title}, by {self.author}"
