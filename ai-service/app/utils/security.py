import secrets

from fastapi import Header, HTTPException, status

from app.utils import config


async def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    """Rejects callers that don't present the shared backend key.

    With no key configured (local development) every call is allowed.
    """
    expected = config.AI_SERVICE_API_KEY

    if not expected:
        return

    if not x_api_key or not secrets.compare_digest(x_api_key, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )
