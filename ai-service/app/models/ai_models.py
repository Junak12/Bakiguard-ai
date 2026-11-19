from typing import List, Optional

from pydantic import BaseModel, Field


class CustomerData(BaseModel):
    name: str = Field(max_length=100)
    baki: float = Field(ge=0)
    total_credit: float = Field(ge=0)
    total_payment: float = Field(ge=0)
    credit_count: int = Field(ge=0)
    payment_count: int = Field(ge=0)
    days_since_payment: Optional[int] = Field(default=None, ge=0)


class DashboardInsightRequest(BaseModel):
    total_customers: int = Field(ge=0)
    total_credit: float = Field(ge=0)
    total_payment: float = Field(ge=0)
    total_baki: float = Field(ge=0)
    # Money past its due date, and how many customers owe it.
    total_overdue: float = Field(default=0, ge=0)
    overdue_customers: int = Field(default=0, ge=0)
    customers: List[CustomerData] = Field(default_factory=list, max_length=50_000)
