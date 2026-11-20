from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class CustomerRiskFeatures(BaseModel):
    """What the backend knows about one customer's payment behaviour."""

    id: str = Field(max_length=64)

    # Current state
    total_due: float = Field(ge=0)
    overdue_amount: float = Field(ge=0, default=0)
    days_late_now: int = Field(ge=0, default=0)

    # History
    credit_count: int = Field(ge=0, default=0)
    settled_count: int = Field(ge=0, default=0)
    settled_on_time_count: int = Field(ge=0, default=0)
    avg_days_late_settled: float = Field(ge=0, default=0)
    total_credit: float = Field(ge=0, default=0)
    total_paid: float = Field(ge=0, default=0)
    days_since_last_payment: Optional[int] = Field(default=None, ge=0)
    tenure_days: int = Field(ge=0, default=0)


class RiskRequest(BaseModel):
    customers: List[CustomerRiskFeatures] = Field(default_factory=list, max_length=50_000)
    # Credit limit offered to customers without enough history.
    starter_limit: float = Field(default=2000, ge=0)


RiskBand = Literal["new", "low", "medium", "high"]


class RiskReason(BaseModel):
    code: str
    params: dict = Field(default_factory=dict)
    # +1 helps the score, -1 hurts it.
    impact: Literal[-1, 1]


class CustomerRisk(BaseModel):
    id: str
    score: int
    band: RiskBand
    suggested_limit: float
    reasons: List[RiskReason]
