import os

from dotenv import load_dotenv


load_dotenv()


ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", "8000"))

# Shared secret sent by the backend in the X-API-Key header.
# This service is internal: only the BakiGuard backend should call it.
AI_SERVICE_API_KEY = os.getenv("AI_SERVICE_API_KEY", "")

if ENVIRONMENT == "production" and not AI_SERVICE_API_KEY:
    raise RuntimeError("AI_SERVICE_API_KEY is required in production")
