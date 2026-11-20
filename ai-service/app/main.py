from fastapi import Depends, FastAPI

from app.routes.insight_routes import router as insight_router
from app.routes.risk_routes import router as risk_router
from app.utils import config
from app.utils.security import require_api_key


app = FastAPI(
    title="BakiGuard AI Service",
    description="Internal AI service for BakiGuard. Called only by the backend.",
    version="1.0.0",
    # Interactive API docs are useful locally but should not be public.
    docs_url=None if config.ENVIRONMENT == "production" else "/docs",
    redoc_url=None,
    openapi_url=None if config.ENVIRONMENT == "production" else "/openapi.json",
)


# No CORS middleware: browsers never call this service directly.
app.include_router(
    insight_router,
    prefix="/api/ai",
    tags=["AI Insights"],
    dependencies=[Depends(require_api_key)],
)


app.include_router(
    risk_router,
    prefix="/api/ai",
    tags=["Customer risk"],
    dependencies=[Depends(require_api_key)],
)


@app.get("/health")
async def health():
    return {
        "success": True,
        "message": "BakiGuard AI Service is running",
    }
