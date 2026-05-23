import csv
import io
from contextlib import asynccontextmanager
from typing import Any, Literal

from fastapi import Depends, FastAPI, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from psycopg2 import errors as pg_errors
from pydantic import BaseModel

from auth import get_current_reader_id, get_current_user
from db import books_repo, comparisons_repo, readers_repo
from db.connection import init_db
from services import library_service
from services.game_service import (
    BookNotFoundError,
    NotEnoughBooksError,
    resolve_comparison,
    select_opponents,
)
from services.library_service import add_book as add_b
from services.ranking_service import build_leaderboard
from services.scoring_service import calculate_progress

# ====== APP SETUP


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite's dev server
        "https://bookbrawl.app",  # Production domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


# ====== MATCHES: MAIN GAME LOOP


class MatchResult(BaseModel):
    winner_id: int
    loser_id: int


@app.get("/brawl")
def get_match(
    reader_id: int = Depends(get_current_reader_id),
) -> dict[str, dict[str, int | str]]:
    """Return two books to face off"""
    try:
        book_a, book_b = select_opponents(reader_id)
    except NotEnoughBooksError:
        raise HTTPException(status_code=400, detail="Not enough books")

    return {
        "book_a": {
            "id": book_a.id,
            "title": book_a.title,
            "author": book_a.author,
        },
        "book_b": {
            "id": book_b.id,
            "title": book_b.title,
            "author": book_b.author,
        },
    }


@app.post("/brawl/resolve", status_code=status.HTTP_201_CREATED)
def post_match(
    result: MatchResult, reader_id: int = Depends(get_current_reader_id)
) -> dict[str, dict[str, int]]:
    """Resolve a match between two books and update their records."""
    try:
        winner, loser = resolve_comparison(reader_id, result.winner_id, result.loser_id)
    except BookNotFoundError:
        raise HTTPException(status_code=404, detail="Books not found")

    return {
        "winner": {"id": winner.id, "elo": winner.elo},
        "loser": {"id": loser.id, "elo": loser.elo},
    }


# ====== LEADERBOARD: PROGRESS & RANKINGS


@app.get("/progress")
def get_progress(
    reader_id: int = Depends(get_current_reader_id),
) -> float:
    """Return the user's overall progress in the game."""
    matches_played = comparisons_repo.count(reader_id)

    if matches_played < 3:
        return 0.0

    books = books_repo.get_all_history(reader_id)

    return round(calculate_progress(books), 4)


@app.get("/leaderboard")
def get_leaderboard(
    reader_id: int = Depends(get_current_reader_id),
) -> list[dict[str, int | str | float]]:
    return build_leaderboard(reader_id)


# ====== COLLECTION MANAGEMENT


class BookData(BaseModel):
    title: str
    author: str
    rating: float | None = None


@app.get("/stacks")
def get_books(
    reader_id: int = Depends(get_current_reader_id),
) -> list[dict[str, int | str]]:
    """Return the user's collection of books, sorted alphabetically by title."""
    return books_repo.get_all(reader_id)


@app.post("/stacks", status_code=status.HTTP_201_CREATED)
def add_book(
    book: BookData, reader_id: int = Depends(get_current_reader_id)
) -> dict[str, int | str]:
    """Add a new book to the collection."""
    try:
        new_book = add_b(reader_id, book.title, book.author, book.rating)
    except pg_errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="Book already exists")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"id": new_book.id, "title": new_book.title, "author": new_book.author}


@app.post("/stacks/import", status_code=status.HTTP_201_CREATED)
def import_books(
    file: UploadFile,
    source: Literal["custom", "goodreads"] = Form("custom"),
    reader_id: int = Depends(get_current_reader_id),
) -> dict[str, int | bool]:
    """Import books from a CSV file."""
    filename = file.filename or ""
    if not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type")

    content = file.file.read().decode("utf-8")
    file_reader = csv.DictReader(io.StringIO(content))

    if not file_reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    file_reader.fieldnames = [f.lower().strip() for f in file_reader.fieldnames]
    if "title" not in file_reader.fieldnames or "author" not in file_reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV file missing required columns")

    try:
        result = library_service.import_books(reader_id, source, file_reader)
    except pg_errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="Book already exists")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "imported": result.imported,
        "invalid": result.invalid,
        "duplicates": result.duplicates,
        "interrupted": result.interrupted,
    }


@app.patch("/stacks/{book_id}")
def update_book(
    book_id: int, book: BookData, reader_id: int = Depends(get_current_reader_id)
) -> dict[str, int | str]:
    """Update the details of a book in the collection."""
    try:
        updated = books_repo.update(
            reader_id, book_id, book.title.strip(), book.author.strip()
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Book not found")
    except pg_errors.UniqueViolation:
        raise HTTPException(
            status_code=409,
            detail="A book with that title and author already exists",
        )

    return {"id": book_id, "title": book.title.strip(), "author": book.author.strip()}


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


class UserSync(BaseModel):
    email: str
    username: str


@app.post("/readers")
def sync_user(
    data: UserSync, clerk_id: str = Depends(get_current_user)
) -> dict[str, int | str | bool]:
    """Create a new user record on the first login or return an existing one."""
    user = readers_repo.get_by_clerk_id(clerk_id)

    if not user:
        try:
            user_id = readers_repo.insert(clerk_id, data.email, data.username)
        except pg_errors.UniqueViolation:
            raise HTTPException(status_code=409, detail="User already exists")

        return {"id": user_id, "clerk_id": clerk_id, "created": True}

    return {"id": user["id"], "clerk_id": clerk_id, "created": False}
