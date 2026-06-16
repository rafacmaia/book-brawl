import csv
import io
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import Depends, FastAPI, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from psycopg2 import errors as pg_errors

from auth import get_current_reader_id, get_current_user
from config import ALLOWED_ORIGINS, MAX_FILE_SIZE
from db import books_repo, comparisons_repo, readers_repo
from db.connection import init_db
from schemas import (
    BookData,
    BookElo,
    BookStanding,
    BookSummary,
    FileSource,
    ImportOutcome,
    Match,
    MatchOutcome,
    MatchResolution,
    Progress,
    UserBookCount,
    UserSync,
)
from services import library_service
from services.game_service import (
    BookNotFoundError,
    InvalidMatchError,
    NotEnoughBooksError,
    resolve_comparison,
    select_opponents,
)
from services.ranking_service import build_leaderboard
from services.scoring_service import calculate_progress

# ====== APP SETUP


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

# noinspection PyTypeChecker
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
def health():
    return {"status": "ok"}


# ====== MATCHES: MAIN GAME LOOP


@app.get("/brawl")
def get_match(
    reader_id: int = Depends(get_current_reader_id),
) -> Match:
    """Return two books to face off"""
    try:
        book_a, book_b = select_opponents(reader_id)
    except NotEnoughBooksError:
        raise HTTPException(status_code=400, detail="Not enough books")

    return Match(
        book_a=BookSummary(id=book_a.id, title=book_a.title, author=book_a.author),
        book_b=BookSummary(id=book_b.id, title=book_b.title, author=book_b.author),
    )


@app.post("/brawl/resolve", status_code=status.HTTP_201_CREATED)
def post_match(
    result: MatchOutcome, reader_id: int = Depends(get_current_reader_id)
) -> MatchResolution:
    """Resolve a match between two books and update their records."""
    try:
        winner, loser = resolve_comparison(reader_id, result.winner_id, result.loser_id)
    except BookNotFoundError:
        raise HTTPException(status_code=404, detail="Books not found")
    except InvalidMatchError:
        raise HTTPException(status_code=400, detail="Invalid match")

    return MatchResolution(
        winner=BookElo(id=winner.id, elo=winner.elo),
        loser=BookElo(id=loser.id, elo=loser.elo),
    )


# ====== LEADERBOARD: PROGRESS & RANKINGS


@app.get("/progress")
def get_progress(
    reader_id: int = Depends(get_current_reader_id),
) -> Progress:
    """Return the user's overall progress in the game."""
    matches_played = comparisons_repo.count(reader_id)

    if matches_played < 3:
        return Progress(progress=0.0)

    books = books_repo.get_all_history(reader_id)

    return Progress(progress=round(calculate_progress(books), 4))


@app.get("/leaderboard")
def get_leaderboard(
    reader_id: int = Depends(get_current_reader_id),
) -> list[BookStanding]:
    return [BookStanding(**book) for book in build_leaderboard(reader_id)]


# ====== LIBRARY MANAGEMENT


@app.get("/stacks")
def get_books(
    reader_id: int = Depends(get_current_reader_id),
) -> list[BookSummary]:
    """Return the user's collection of books, sorted alphabetically by title."""
    return [BookSummary(**book) for book in books_repo.get_all(reader_id)]


@app.post("/stacks", status_code=status.HTTP_201_CREATED)
def add_book(
    book: BookData, reader_id: int = Depends(get_current_reader_id)
) -> BookSummary:
    """Add a new book to the collection."""
    try:
        new_book = library_service.add_book(
            reader_id, book.title, book.author, book.rating
        )
    except pg_errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="Book already exists")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return BookSummary(id=new_book.id, title=new_book.title, author=new_book.author)


@app.post("/stacks/import", status_code=status.HTTP_201_CREATED)
def import_books(
    file: UploadFile,
    source: FileSource = Form(FileSource.custom),
    reader_id: int = Depends(get_current_reader_id),
) -> ImportOutcome:
    """Import books from a CSV file."""
    filename = file.filename or ""
    if not filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=415,
            detail="That doesn't look like a CSV! Make sure you're uploading a .csv file.",
        )

    raw = file.file.read()
    if len(raw) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (2 MB limit)")

    try:
        content = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=415, detail="File must be UTF-8 encoded!")

    file_reader = csv.DictReader(io.StringIO(content))
    file_reader.fieldnames = [f.lower().strip() for f in (file_reader.fieldnames or [])]

    if "title" not in file_reader.fieldnames or "author" not in file_reader.fieldnames:
        raise HTTPException(
            status_code=422,
            detail="Looks like your CSV is missing some columns. Make sure the first row contains 'title' and 'author' headers.",
        )

    try:
        result = library_service.import_books(reader_id, source, file_reader)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return ImportOutcome.model_validate(result)


@app.patch("/stacks/{book_id}")
def update_book(
    book_id: int, book: BookData, reader_id: int = Depends(get_current_reader_id)
) -> BookSummary:
    """Update the details of a book in the collection."""
    try:
        updated = books_repo.update(reader_id, book_id, book.title, book.author)
        if not updated:
            raise HTTPException(status_code=404, detail="Book not found")
    except pg_errors.UniqueViolation:
        raise HTTPException(
            status_code=409,
            detail="A book with that title and author already exists",
        )

    return BookSummary(id=book_id, title=book.title, author=book.author)


@app.delete("/stacks/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(book_id: int, reader_id: int = Depends(get_current_reader_id)) -> None:
    """Remove a book from the collection."""
    if not books_repo.delete(reader_id, book_id):
        raise HTTPException(status_code=404, detail="Book not found")


@app.delete("/stacks", status_code=status.HTTP_204_NO_CONTENT)
def delete_all_books(reader_id: int = Depends(get_current_reader_id)) -> None:
    """Remove all books from the collection."""
    books_repo.delete_all(reader_id)


# ====== USERS


@app.post("/readers/me")
def bootstrap_session(
    data: UserSync, clerk_id: str = Depends(get_current_user)
) -> UserBookCount:
    """Sync the user with our DB and return their book count.

    Creates the user if they don't exist, or updates their email/username if they do.
    """
    user_id = readers_repo.upsert(clerk_id, data.email, data.username)

    return UserBookCount(book_count=books_repo.count(user_id))
