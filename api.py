import csv
import io
import sqlite3
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from auth import get_current_reader_id, get_current_user
from config import ACCURACY_TIERS
from db import books_repo, users_repo
from db.connection import init_db
from models import Book
from services import library_service
from services.game_service import resolve_comparison, select_opponents
from services.ranking_service import rank_books
from services.scoring_service import (
    calculate_progress,
    confidence_score,
)

# ====== APP SETUP


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://web-production-15b98.up.railway.app",
        "https://book-brawl.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ====== MATCHES: MAIN GAME LOOP


class MatchResult(BaseModel):
    winner_id: int
    loser_id: int


@app.get("/brawl")
def get_match(reader_id: str = Depends(get_current_reader_id)):
    """Return two books to face off"""
    books = books_repo.get_all(reader_id)

    if len(books) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Not enough books"
        )

    book_a, book_b = select_opponents(books)
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


@app.post("/brawl/resolve")
def post_match(result: MatchResult, reader_id: str = Depends(get_current_reader_id)):
    """Resolve a match between two books and update their records."""
    books = books_repo.get_all(reader_id)

    book_map = {b.id: b for b in books}

    winner = book_map.get(result.winner_id)
    loser = book_map.get(result.loser_id)

    if winner is None or loser is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Books not found"
        )

    resolve_comparison(reader_id, winner, loser, books)

    return {"status": "ok", "winner": result.winner_id, "loser": result.loser_id}


# ====== LEADERBOARD: PROGRESS & RANKINGS


@app.get("/progress")
def get_progress(reader_id: str = Depends(get_current_reader_id)):
    """Return the user's overall progress in the game."""
    books = books_repo.get_all(reader_id)

    return {
        "progress": round(calculate_progress(books), 4),
        "book_count": len(books),
    }


@app.get("/leaderboard")
def get_leaderboard(reader_id: str = Depends(get_current_reader_id)):
    books = books_repo.get_all(reader_id)

    ranked_books = []

    for rank, book in rank_books(books):
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


# ====== BOOK INSERTIONS


class BookData(BaseModel):
    title: str
    author: str
    rating: float | None = None


@app.post("/books")
def add_book(book: BookData, reader_id: str = Depends(get_current_reader_id)):
    """Add a new book to the collection."""
    books = books_repo.get_all(reader_id)

    existing_books = {(b.title.lower(), b.author.lower()) for b in books}

    if (book.title.lower(), book.author.lower()) in existing_books:
        raise HTTPException(status_code=409, detail="Book already exists")

    new_book = Book(title=book.title, author=book.author, rating=book.rating)

    try:
        books_repo.insert(reader_id, new_book)
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="Book already exists")

    return {"id": new_book.id, "title": new_book.title, "author": new_book.author}


@app.post("/books/import")
def import_books(file: UploadFile, reader_id: str = Depends(get_current_reader_id)):
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

    books = books_repo.get_all(reader_id)

    result = library_service.import_books(reader_id, file_reader, books)

    return {
        "imported": len(result.new_books),
        "skipped": result.skipped,
        "interrupted": result.interrupted,
    }


# ====== USERS


class UserSync(BaseModel):
    email: str
    username: str


@app.post("/readers")
def sync_user(data: UserSync, clerk_id: str = Depends(get_current_user)):
    """Create a new user record on the first login or return an existing one."""
    user = users_repo.get_by_clerk_id(clerk_id)

    if not user:
        try:
            user_id = users_repo.insert(clerk_id, data.email, data.username)
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=409, detail="User already exists")
        return {"id": user_id, "clerk_id": clerk_id, "created": True}

    return {"id": user["id"], "clerk_id": clerk_id, "created": False}
