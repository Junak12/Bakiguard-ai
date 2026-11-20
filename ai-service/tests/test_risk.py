import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.risk_models import CustomerRiskFeatures
from app.services.risk_service import score_customer
from app.utils import config


client = TestClient(app)


@pytest.fixture(autouse=True)
def no_api_key(monkeypatch):
    monkeypatch.setattr(config, "AI_SERVICE_API_KEY", "")


def features(**overrides):
    base = dict(
        id="c1",
        total_due=0,
        overdue_amount=0,
        days_late_now=0,
        credit_count=0,
        settled_count=0,
        settled_on_time_count=0,
        avg_days_late_settled=0,
        total_credit=0,
        total_paid=0,
        days_since_last_payment=None,
        tenure_days=0,
    )
    base.update(overrides)
    return CustomerRiskFeatures(**base)


def codes(result):
    return [reason.code for reason in result.reasons]


def test_new_customer_gets_starter_limit():
    result = score_customer(features(credit_count=1, total_due=500, total_credit=500), 2000)

    assert result.band == "new"
    assert result.suggested_limit == 2000
    assert "new_customer" in codes(result)


def test_reliable_customer_is_low_risk_with_generous_limit():
    result = score_customer(
        features(
            credit_count=10,
            settled_count=10,
            settled_on_time_count=10,
            total_credit=30000,
            total_paid=30000,
            days_since_last_payment=5,
            tenure_days=300,
        ),
        2000,
    )

    assert result.band == "low"
    assert result.score >= 90
    # Pays ~3,000/month; low risk gets 1.5x.
    assert result.suggested_limit == 4500
    assert {"on_time_rate", "recent_payment", "long_relationship"} <= set(codes(result))


def test_late_now_and_usually_late_is_high_risk_and_credit_stops():
    result = score_customer(
        features(
            total_due=5000,
            overdue_amount=5000,
            days_late_now=45,
            credit_count=6,
            settled_count=4,
            settled_on_time_count=1,
            avg_days_late_settled=20,
            total_credit=12000,
            total_paid=7000,
            days_since_last_payment=70,
            tenure_days=200,
        ),
        2000,
    )

    assert result.band == "high"
    assert result.score < 40
    assert result.suggested_limit == 0
    assert codes(result)[0] in {"late_now", "usually_late", "no_recent_payment", "stop_credit", "on_time_rate"}
    assert {"late_now", "usually_late", "no_recent_payment", "stop_credit"} <= set(codes(result))
    # Damaging reasons come before helpful ones.
    impacts = [reason.impact for reason in result.reasons]
    assert impacts == sorted(impacts)


def test_being_late_lowers_an_otherwise_good_score():
    good = features(
        credit_count=5,
        settled_count=5,
        settled_on_time_count=5,
        total_credit=5000,
        total_paid=5000,
        tenure_days=90,
    )
    late = good.model_copy(update={"total_due": 1000, "overdue_amount": 1000, "days_late_now": 30})

    assert score_customer(late, 2000).score < score_customer(good, 2000).score - 20


def test_new_customer_who_is_already_late_is_not_new():
    result = score_customer(
        features(credit_count=1, total_due=800, overdue_amount=800, days_late_now=20, tenure_days=50),
        2000,
    )

    assert result.band != "new"
    assert "late_now" in codes(result)


def test_score_is_clamped():
    result = score_customer(
        features(
            total_due=9000,
            overdue_amount=9000,
            days_late_now=400,
            credit_count=10,
            settled_count=10,
            settled_on_time_count=0,
            avg_days_late_settled=200,
            tenure_days=400,
            total_paid=100,
            days_since_last_payment=300,
        ),
        2000,
    )

    assert 0 <= result.score <= 100


def test_risk_endpoint():
    response = client.post(
        "/api/ai/risk",
        json={
            "starter_limit": 1500,
            "customers": [
                {"id": "a", "total_due": 300, "credit_count": 1, "total_credit": 300},
                {"id": "b", "total_due": 0, "credit_count": 3, "settled_count": 3,
                 "settled_on_time_count": 3, "total_credit": 900, "total_paid": 900,
                 "tenure_days": 60, "days_since_last_payment": 3},
            ],
        },
    )

    assert response.status_code == 200
    data = {item["id"]: item for item in response.json()["data"]}
    assert data["a"]["band"] == "new" and data["a"]["suggested_limit"] == 1500
    assert data["b"]["band"] == "low"
    assert all("reasons" in item for item in data.values())
