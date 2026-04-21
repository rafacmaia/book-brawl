"""Handles user authentication using Clerk JWTs."""

from typing import Annotated

import jwt
import requests
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicKey
from fastapi import HTTPException, status
from fastapi.params import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.algorithms import RSAAlgorithm

from config import CLERK_JWKS_URL
from db import readers_repo

if not CLERK_JWKS_URL:
    raise RuntimeError(
        "Missing required Clerk config: CLERK_JWKS_URL must be set in .env"
    )

_jwks_cache: dict | None = None

# HTTPBearer extracts the JWT from the HTTP request Authorization: Bearer <token> header
bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
) -> str:
    """Verify the JWT and return the Clerk user ID.

    Inject this into every endpoint that requires authentication.
    """
    token = credentials.credentials

    try:
        public_key = _get_public_key(token)  # Get the matching Clerk public key
        payload = jwt.decode(
            token, public_key, algorithms=["RS256"], options={"verify_audience": False}
        )  # Use the public key to first verify JWT is genuine, then decode (unpack) it the JWT
        sub = payload.get("sub")  # Extract the user ID (which lives in the "sub" claim)
        if not sub:
            raise HTTPException(status_code=401, detail="Token missing required claim")
        return sub  # Clerk user ID lives in the "sub" claim

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )


def _get_public_key(token: str) -> RSAPublicKey:
    """Find the matching public key for the given token from Clerk's JWKS.

    Refetches JWKS once if the key isn't found.
    """
    # Extract the metadata (header) from the yet unverified JWT
    headers = jwt.get_unverified_header(token)
    headers_kid = headers.get("kid")  # kid = key ID

    if not headers_kid:
        raise HTTPException(status_code=401, detail="Invalid token: missing kid")

    public_key = _find_key(headers_kid)

    if public_key is None:
        public_key = _find_key(headers_kid, refetch=True)

    if public_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No matching public key found",
        )

    return public_key


def _find_key(kid: str, refetch: bool = False) -> RSAPublicKey | None:
    """Look up a key by kid in the cached JWKS. Return None if not found."""
    jwks = _get_jwks(refetch)

    for key in jwks["keys"]:
        if key.get("kid") == kid:  # Find the matching key
            return RSAAlgorithm.from_jwk(key)  # Convert the JWK to a public key object

    return None


def _get_jwks(refetch: bool = False) -> dict:
    """Fetch Clerk's public keys (JWKS) for JWT verification.

    Uses a cached copy if available.
    """
    global _jwks_cache
    if _jwks_cache is None or refetch:
        response = requests.get(CLERK_JWKS_URL)
        response.raise_for_status()  # Raise an exception if there's an HTTP error
        jwks = response.json()
        _jwks_cache = jwks
        return jwks

    return _jwks_cache


def get_current_reader_id(clerk_id: Annotated[str, Depends(get_current_user)]) -> int:
    """Resolve Clerk ID to internal reader ID."""
    reader = readers_repo.get_by_clerk_id(clerk_id)

    if not reader:
        raise HTTPException(status_code=404, detail="User not found")

    return reader["id"]
