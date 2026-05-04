import os

from dotenv import load_dotenv

load_dotenv()

# ====== ENVIRONMENT

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")

DATABASE_URL = os.getenv("DATABASE_URL")

# ====== APP CONFIG

BOOK_LIMIT = 2000

## ELO & RATING PARAMETERS

ELO_DEFAULT = 1040  # Given to new entries with no initial rating to map from
E_MIN_DEFAULT = 800
E_MAX_DEFAULT = 1200

# K-values define the maximum a book's Elo score can change per match.
# The first value of each pair represents a confidence-level threshold.
# The second value is the K-value assigned to books under the matching threshold.
# Low-confidence books have higher K-values to quickly find their general positioning.
# High-confidence books have lower K-values to stabilize their rankings and prevent
#   ongoing large swings.
K_TIERS = [(0.25, 40), (0.5, 32), (0.75, 24), (0.9, 16), (1.0, 8)]

# Rating floor used to map new books into an active Elo range grown beyond the defaults.
# Real-world ratings skew high (1-2 ratings are rare), so a floor higher than 1 better
#   reflects how raw ratings map to relative position in an ongoing library.
# See _rating_to_elo in library_service for full mapping details.
RATING_FLOOR = 3

# Bump of one initial K-value to prevent a very low-rated new entry from being
#   immediately pinned to the bottom before seeing any matches.
RATING_FLOOR_BUMP = K_TIERS[0][1]

## CONFIDENCE SCORING PARAMETERS

# Main components of confidence scoring:
#   Absolute scoring  – measures if a book has seen a minimum number of matches.
#   Local scoring     – measures how many of its relevant opponents a book has faced,
#                       i.e., those where the expected_score is fairly uncertain,
#                       defined by LOCAL_WINDOW.
#   Stability scoring - measures how many immediate threats a book has, i.e., books with
#                       an Elo score within a DENSITY_WINDOW that could flip rankings
#                       within 1-2 matches.
ABS_SCORE_WEIGHT = 0.30
LOC_SCORE_WEIGHT = 0.45
STA_SCORE_WEIGHT = 0.25

ABS_BASE = 5  # Floor of minimum opponents, used in absolute scoring

LOCAL_WINDOW = 0.12  # Expected score window, used in local scoring

DENSITY_WINDOW = 16  # Elo score window, used in stability scoring
DENSITY_CAP = 10  # Maximum number of neighbors to consider in stability scoring

# Thresholds of individual book accuracy tiers. Used to interpret a book's confidence
#   score (0-1) in terms of tiers of rank trust (i.e., accuracy).
ACCURACY_TIERS = [0.10, 0.35, 0.7, 0.9, 1.00]
