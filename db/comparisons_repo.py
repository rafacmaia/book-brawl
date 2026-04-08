from db.connection import get_connection


def insert(reader_id, winner_id, loser_id):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO comparison (reader_id, winner_id, loser_id) VALUES (%s, %s, %s)",
                (reader_id, winner_id, loser_id),
            )
