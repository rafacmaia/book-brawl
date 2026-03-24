from db.connection import get_connection


def insert(winner_id, loser_id):
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO comparison (winner_id, loser_id) VALUES (?, ?)",
            (winner_id, loser_id),
        )
