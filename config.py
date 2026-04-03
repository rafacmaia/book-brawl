import os

from dotenv import load_dotenv

load_dotenv()

# ====== APP CONFIG

BOOK_LIMIT = 2000

PROGRESS_TIERS = [0.20, 0.45, 0.65, 0.85, 0.95, 1.00]
ACCURACY_TIERS = [0.10, 0.30, 0.65, 0.85, 1.00]

# ====== CLERK AUTH

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")

# ====== DATABASE

DB_PATH = os.getenv("DB_PATH", "data/book_brawl_v1.db")
