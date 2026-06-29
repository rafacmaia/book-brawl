from dataclasses import dataclass
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

import httpx

from config import GOOGLE_BOOKS_API_KEY

GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"


# ====== TYPES


@dataclass
class CatalogResult:
    cover_url: str | None
    isbn: str | None


# ====== PUBLIC API


def fetch_book_metadata(title: str, author: str) -> CatalogResult:
    """Look up a book by title and author in Google Books, returning cover URL and ISBN.

    Returns CatalogResult with None values if the book isn't found or the request fails.
    """
    book_data = _call_google_books(title, author)

    if book_data is None:
        return CatalogResult(None, None)

    cover_url = _extract_cover_url(book_data)
    isbn = _extract_isbn(book_data)

    return CatalogResult(cover_url, isbn)


# ====== HELPERS


def _call_google_books(title: str, author: str) -> dict | None:
    """Make a request to the Google Books API and return the first result's volume info.

    Return None if the request fails or no results are found.
    """
    params = {
        "q": f"intitle:{title}+inauthor:{author}",  # Google Books field names
        "maxResults": 1,  # Get only the top result
        "key": GOOGLE_BOOKS_API_KEY,
    }

    try:
        response = httpx.get(GOOGLE_BOOKS_URL, params=params, timeout=5.0)
        response.raise_for_status()
        data = response.json()
    except (httpx.HTTPError, ValueError):
        return None

    items = data.get("items")
    if not items:
        return None

    return items[0].get("volumeInfo", {})


def _extract_cover_url(volume_info: dict) -> str | None:
    """Return the best available cover image URL, or None.

    Aim for ~300x450px (Google Books' 'small' size), falling back to an upsized
    'thumbnail' if necessary.
    """
    image_links = volume_info.get("imageLinks", {})

    cover_url: str | None = image_links.get("small")
    if cover_url:
        return cover_url.replace("http://", "https://")

    fallback_url: str | None = image_links.get("thumbnail")
    if fallback_url:
        return _upsize_cover_url(fallback_url.replace("http://", "https://"))

    return None


def _upsize_cover_url(url: str, zoom: int = 2) -> str:
    """Bump a Google Books image URL to a larger zoom level.

    Manipulates the zoom query param directly rather than string-replacing.
    """
    parsed_url = urlparse(url)
    params = parse_qs(parsed_url.query)
    params["zoom"] = [str(zoom)]

    return str(urlunparse(parsed_url._replace(query=urlencode(params, doseq=True))))


def _extract_isbn(volume_info: dict) -> str | None:
    """Return the book's ISBN-13, falling back to ISBN-10 if needed."""
    identifiers = volume_info.get("industryIdentifiers", [])

    isbn_13 = next(
        (
            entry["identifier"]
            for entry in identifiers
            if entry.get("type") == "ISBN_13"
        ),
        None,
    )

    if isbn_13:
        return isbn_13

    # Older books might only have ISBN-10
    return next(
        (
            entry["identifier"]
            for entry in identifiers
            if entry.get("type") == "ISBN_10"
        ),
        None,
    )
