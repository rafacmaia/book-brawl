import psycopg2.extras

from db.connection import get_connection


def get_by_clerk_id(clerk_id: str) -> dict | None:
    """Get a user by their Clerk ID. Returns None if not found."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM reader WHERE clerk_id = %s", (clerk_id,))
            row = cur.fetchone()

            return dict(row) if row else None


def insert(clerk_id: str, email: str, username: str) -> int:
    """Insert a new user record. Returns the new user's ID."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                    INSERT INTO reader (clerk_id, email, username) 
                    VALUES (%s, %s, %s) 
                    RETURNING id
                """,
                (clerk_id, email, username),
            )
            return cur.fetchone()["id"]
