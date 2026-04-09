from contextlib import contextmanager
from pathlib import Path

import psycopg2
import psycopg2.pool

from config import DATABASE_URL

_pool = None


def get_pool():
    global _pool
    if _pool is None:
        _pool = psycopg2.pool.ThreadedConnectionPool(1, 10, DATABASE_URL)
    return _pool


@contextmanager
def get_connection():
    pool = get_pool()
    conn = pool.getconn()
    conn.autocommit = True
    try:
        yield conn
    finally:
        pool.putconn(conn)


def init_db():
    schema_path = Path(__file__).parent / "schema.sql"

    with get_connection() as conn:
        with conn.cursor() as cur:
            with open(schema_path, "r") as f:
                cur.execute(f.read())
