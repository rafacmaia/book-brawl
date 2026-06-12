from contextlib import contextmanager
from pathlib import Path

import psycopg2
import psycopg2.pool

from config import DATABASE_URL

_pool = None


def get_pool() -> psycopg2.pool.ThreadedConnectionPool:
    global _pool
    if _pool is None:
        _pool = psycopg2.pool.ThreadedConnectionPool(1, 10, DATABASE_URL)
    return _pool


@contextmanager
def get_connection(*, transactional: bool = False):
    pool = get_pool()
    conn = pool.getconn()
    conn.autocommit = not transactional
    try:
        yield conn
        if transactional:
            conn.commit()
    except Exception:
        if transactional:
            conn.rollback()
        raise
    finally:
        pool.putconn(conn)


def init_db() -> None:
    schema_path = Path(__file__).parent / "schema.sql"

    with get_connection() as conn:
        with conn.cursor() as cur:
            with open(schema_path, "r") as f:
                cur.execute(f.read())
