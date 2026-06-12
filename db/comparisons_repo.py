from db.connection import get_connection


def insert(reader_id: int, winner_id: int, loser_id: int, *, conn=None) -> None:
    def _execute(connection):
        with connection.cursor() as cur:
            cur.execute(
                "INSERT INTO comparison (reader_id, winner_id, loser_id) VALUES (%s, %s, %s)",
                (reader_id, winner_id, loser_id),
            )

    if conn:
        _execute(conn)
    else:
        with get_connection() as c:
            _execute(c)


def count(reader_id: int) -> int:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM comparison WHERE reader_id = %s",
                (reader_id,),
            )
            return cur.fetchone()[0]
