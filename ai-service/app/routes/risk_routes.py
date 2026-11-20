from fastapi import APIRouter

from app.models.risk_models import RiskRequest
from app.services.risk_service import score_customers


router = APIRouter()


@router.post("/risk")
async def customer_risk(data: RiskRequest):
    results = score_customers(data.customers, data.starter_limit)

    return {
        "success": True,
        "data": [result.model_dump() for result in results],
    }
