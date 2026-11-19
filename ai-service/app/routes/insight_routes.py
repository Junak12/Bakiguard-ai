from fastapi import APIRouter

from app.models.ai_models import DashboardInsightRequest
from app.services.insight_service import (
    generate_dashboard_insights,
)


router = APIRouter()


@router.post("/dashboard-insights")
async def dashboard_insights(
    data: DashboardInsightRequest,
):
    result = generate_dashboard_insights(data)

    return {
        "success": True,
        "data": result,
    }