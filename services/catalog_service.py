import logging
import time
from dataclasses import dataclass

import httpx

# ====== CONFIG

# Open Library API search endpoint
OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json"

# Open Library cover image URL template
OPEN_LIBRARY_COVER_URL = (
    "https://covers.openlibrary.org/b/id/{cover_id}.jpg?default=false"
)

# Courtesy User-Agent header to identify BookBrawl in Open Library API requests
HEADERS = {"User-Agent": "BookBrawl/1.0 (https://bookbrawl.app; zoulabs.dev@gmail.com)"}

# Open Library's search endpoint is slow — 10s accommodates their typical response
# times without hanging indefinitely if OL is truly down.
OPEN_LIBRARY_TIMEOUT = 10.0

# One retry with a short backoff handles OL's frequent transient failures (timeouts,
# connection resets) without hammering them.
MAX_RETRIES = 1
RETRY_DELAY = 1.5

# Open Library API rate limit: 100 requests per 5 minutes; for batch requests, use this
# delay to stay under limit. Multiplied by 3 for extra safety (allows up to 3
# simultaneous requests without exceeding limit)
REQUEST_DELAY = (5 * 60 / 100) * 3

logger = logging.getLogger(__name__)

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
    """Query Open Library API for a book's metadata, returns the top result or None."""
    params = {
        # Searching by q= matches more reliably than searching by title=/author=, which
        # apply stricter filters and mis-rank works like box sets above the actual book.
        "q": f"{title} {author}",
        "limit": 1,  # Only grab the top result
        "fields": "cover_i,isbn",  # Only request what we need
    }

    for attempt in range(1 + MAX_RETRIES):
        try:
            response = httpx.get(
                OPEN_LIBRARY_SEARCH_URL,
                params=params,
                headers=HEADERS,
                timeout=OPEN_LIBRARY_TIMEOUT,
            )
            response.raise_for_status()
            data = response.json()
            break  # Success, exit retry loop

        except httpx.RequestError as e:
            # Transient network failure (timeout, connection reset, read error, etc.)
            if attempt < MAX_RETRIES:
                logger.info(
                    "Open Library request failed for %r by %r: %s, retrying...",
                    title,
                    author,
                    e,
                )
                time.sleep(RETRY_DELAY)
                continue
            logger.warning(
                "Open Library request failed for %r by %r: %s", title, author, e
            )
            return None

        except httpx.HTTPStatusError as e:
            if e.response.status_code >= 500:
                # Server error — transient, worth retrying
                if attempt < MAX_RETRIES:
                    logger.info(
                        "Open Library returned %s for %r by %r, retrying...",
                        e.response.status_code,
                        title,
                        author,
                    )
                    time.sleep(RETRY_DELAY)
                    continue

            # 4xx or exhausted retries — log and give up
            logger.warning(
                "Open Library request failed for %r by %r: %s",
                title,
                author,
                e,
            )
            return None

        except ValueError as e:
            # JSON decode failure — not transient, don't retry
            logger.warning(
                "Open Library returned invalid JSON for %r by %r: %s",
                title,
                author,
                e,
            )
            return None
    else:
        return None

    docs = data.get("docs")  # Open Library returns matching records in a "docs" array
    if not docs:
        logger.info("No Open Library match for %r by %r", title, author)
        return None

    return docs[0]


def _extract_cover_url(doc: dict) -> str | None:
    """Build a cover image URL from the doc's cover ID."""
    cover_id = doc.get("cover_i")
    if cover_id is None:
        return None

    return OPEN_LIBRARY_COVER_URL.format(cover_id=cover_id)


def _extract_isbn(doc: dict) -> str | None:
    """Return an ISBN from the doc's ISBN list.

    Open Library search returns a list of ISBNs spanning all known editions. We only
    retrieve the top ISBN-13 available, falling back to ISBN-10 if necessary.
    """
    isbns = doc.get("isbn") or []
    if not isbns:
        return None

    isbn_13 = next((i for i in isbns if len(i) == 13), None)

    return isbn_13 or isbns[0]
