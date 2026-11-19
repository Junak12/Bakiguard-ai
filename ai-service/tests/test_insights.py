import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.utils import config


client = TestClient(app)


def customer(name, baki, **overrides):
    return {
        "name": name,
        "baki": baki,
        "total_credit": baki,
        "total_payment": 0,
        "credit_count": 1,
        "payment_count": 0,
        "days_since_payment": None,
        **overrides,
    }


def payload(**overrides):
    return {
        "total_customers": 2,
        "total_credit": 1500,
        "total_payment": 400,
        "total_baki": 1100,
        "customers": [customer("Karim", 800), customer("Rahim", 300)],
        **overrides,
    }


@pytest.fixture(autouse=True)
def no_api_key(monkeypatch):
    monkeypatch.setattr(config, "AI_SERVICE_API_KEY", "")


def test_health():
    response = client.get("/health")
    assert response.status_code == 200


def test_flags_outstanding_baki_and_top_customer():
    response = client.post("/api/ai/dashboard-insights", json=payload())

    assert response.status_code == 200
    insights = response.json()["data"]["insights"]
    titles = [insight["title"] for insight in insights]

    assert "Outstanding Baki" in titles
    top = next(i for i in insights if i["type"] == "customer")
    assert top["customer"] == "Karim"


def test_empty_shop_gets_getting_started_tip():
    response = client.post(
        "/api/ai/dashboard-insights",
        json=payload(
            total_customers=0,
            total_credit=0,
            total_payment=0,
            total_baki=0,
            customers=[],
        ),
    )

    insights = response.json()["data"]["insights"]
    assert [i["title"] for i in insights] == ["Getting Started"]


def test_rejects_negative_values():
    response = client.post("/api/ai/dashboard-insights", json=payload(total_baki=-5))
    assert response.status_code == 422


def test_requires_api_key_when_configured(monkeypatch):
    monkeypatch.setattr(config, "AI_SERVICE_API_KEY", "secret-key")

    missing = client.post("/api/ai/dashboard-insights", json=payload())
    wrong = client.post(
        "/api/ai/dashboard-insights",
        json=payload(),
        headers={"X-API-Key": "nope"},
    )
    right = client.post(
        "/api/ai/dashboard-insights",
        json=payload(),
        headers={"X-API-Key": "secret-key"},
    )

    assert missing.status_code == 401
    assert wrong.status_code == 401
    assert right.status_code == 200
