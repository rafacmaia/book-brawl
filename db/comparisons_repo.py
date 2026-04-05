from db.connection import get_connection


def insert(winner_id, loser_id):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO comparison (winner_id, loser_id) VALUES (%s, %s)",
                (winner_id, loser_id),
            )
