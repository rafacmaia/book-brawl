from dataclasses import dataclass

import httpx

OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json"
OPEN_LIBRARY_COVER_URL = (
    "https://covers.openlibrary.org/b/id/{cover_id}.jpg?default=false"
)
HEADERS = {"User-Agent": "BookBrawl/1.0 (https://bookbrawl.app; zoulabs.dev@gmail.com)"}


# ====== TYPES


@dataclass
class CatalogResult:
    cover_url: str | None
    isbn: str | None


# ====== PUBLIC API


def fetch_book_metadata(title: str, author: str) -> CatalogResult:
    """Look up a book by title and author in Open Library, returning cover URL and ISBN.

    Returns CatalogResult with None values if the book isn't found or the request fails.
    """
    doc = _search_open_library(title, author)

    if doc is None:
        return CatalogResult(None, None)

    cover_url = _extract_cover_url(doc)
    isbn = _extract_isbn(doc)

    return CatalogResult(cover_url, isbn)


# ====== HELPERS


def _search_open_library(title: str, author: str) -> dict | None:
    """Query Open Library search and return the top result or None.

    Returns None if the request fails or no results are found.
    """
    params = {
        # q= matches more reliably than searching by title=/author=, which apply
        # stricter filters and mis-rank works like box sets above the actual book.
        "q": f"{title} {author}",
        "limit": 1,
        "fields": "cover_i,isbn",  # Only request what we need
    }

    try:
        response = httpx.get(
            OPEN_LIBRARY_SEARCH_URL, params=params, headers=HEADERS, timeout=5.0
        )
        response.raise_for_status()
        data = response.json()
    except (httpx.HTTPError, ValueError):
        return None

    docs = data.get("docs")
    if not docs:
        return None

    return docs[0]


def _extract_cover_url(doc: dict) -> str | None:
    """Build a cover image URL from the doc's cover ID."""
    cover_id = doc.get("cover_i")
    if cover_id is None:
        return None

    return OPEN_LIBRARY_COVER_URL.format(cover_id=cover_id)


def _extract_isbn(doc: dict) -> str | None:
    """Return an ISBN-13 from the doc's ISBN list, falling back to ISBN-10 if needed.

    Open Library search returns a list of ISBNs spanning all editions, we only need
    one ISBN-13.
    """
    isbns = doc.get("isbn")
    if not isbns:
        return None

    isbn_13 = next((i for i in isbns if len(i) == 13), None)

    return isbn_13 or isbns[0]
