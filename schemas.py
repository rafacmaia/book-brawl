from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

# ====== ENUMS


class FileSource(str, Enum):
    custom = "custom"
    goodreads = "goodreads"


# ====== SHARED


class BookSummary(BaseModel):
    id: int
    title: str
    author: str


# ====== MATCHES


class Match(BaseModel):
    book_a: BookSummary
    book_b: BookSummary


class MatchOutcome(BaseModel):
    winner_id: int
    loser_id: int


class BookElo(BaseModel):
    id: int
    elo: int


class MatchResolution(BaseModel):
    winner: BookElo
    loser: BookElo


# ====== LEADERBOARD


class Progress(BaseModel):
    progress: float


class BookStanding(BaseModel):
    id: int
    rank: int
    title: str
    author: str
    accuracy_score: float
    accuracy_tier: int


# ====== LIBRARY MANAGEMENT


class BookData(BaseModel):
    title: str
    author: str
    rating: float | None = None

    @field_validator("title", "author")
    @classmethod
    def strip_and_require(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Title and author are required")
        return stripped


class ImportOutcome(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    imported: int
    invalid: int
    duplicates: int
    interrupted: bool


# ====== USERS


class UserSync(BaseModel):
    email: EmailStr
    username: str


class UserBookCount(BaseModel):
    book_count: int
