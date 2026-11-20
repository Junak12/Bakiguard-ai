"""Customer credit risk: an explainable score, a band and a suggested credit limit.

Deliberately a transparent scorecard rather than a black-box model: a shop
owner must be able to see *why* a customer is risky, and one shop's history
is far too small to train on. Every point added or removed has a reason the
app can show. The interface (features in, score + reasons out) stays the
same if this is later replaced by a model trained across many shops.
"""

from app.models.risk_models import CustomerRisk, CustomerRiskFeatures, RiskReason

# Score bands (higher score = safer).
LOW_RISK_MIN = 70
MEDIUM_RISK_MIN = 40

# A credit paid within this many days after its due date still counts as on time.
GRACE_DAYS = 2

MIN_HISTORY = 2  # settled credits needed before history drives the score
MIN_LIMIT = 500

LIMIT_FACTOR = {"low": 1.5, "medium": 1.0, "high": 0.5}


def _round_to(value: float, step: int = 100) -> float:
    return float(int(round(value / step)) * step)


def _reason(code: str, impact: int, **params) -> RiskReason:
    return RiskReason(code=code, impact=impact, params=params)


def score_customer(c: CustomerRiskFeatures, starter_limit: float) -> CustomerRisk:
    reasons: list[RiskReason] = []
    has_history = c.settled_count >= MIN_HISTORY

    # ---- Base score -------------------------------------------------------
    if has_history:
        on_time_rate = c.settled_on_time_count / c.settled_count
        score = 40 + 50 * on_time_rate  # 40..90
        percent = round(on_time_rate * 100)

        reasons.append(
            _reason(
                "on_time_rate",
                1 if on_time_rate >= 0.7 else -1,
                percent=percent,
                on_time=c.settled_on_time_count,
                total=c.settled_count,
            )
        )
    else:
        score = 65.0

    # ---- Late right now (the strongest signal) ----------------------------
    if c.overdue_amount > 0 and c.days_late_now > 0:
        score -= min(40.0, c.days_late_now * 0.8)
        reasons.append(
            _reason("late_now", -1, days=c.days_late_now, amount=c.overdue_amount)
        )

    # ---- Usually pays late ------------------------------------------------
    if has_history and c.avg_days_late_settled >= 3:
        score -= min(20.0, c.avg_days_late_settled * 0.5)
        reasons.append(
            _reason("usually_late", -1, days=round(c.avg_days_late_settled))
        )

    # ---- Payment recency ---------------------------------------------------
    if c.total_due > 0:
        if c.days_since_last_payment is None:
            if c.tenure_days >= 30:
                score -= 10
                reasons.append(_reason("never_paid", -1, days=c.tenure_days))
        elif c.days_since_last_payment >= 60:
            score -= 10
            reasons.append(
                _reason("no_recent_payment", -1, days=c.days_since_last_payment)
            )

    if c.days_since_last_payment is not None and c.days_since_last_payment <= 14:
        score += 5
        reasons.append(
            _reason("recent_payment", 1, days=c.days_since_last_payment)
        )

    # ---- Long, good relationship ------------------------------------------
    if has_history and c.tenure_days >= 180 and c.settled_on_time_count / c.settled_count >= 0.8:
        score += 5
        reasons.append(_reason("long_relationship", 1, months=c.tenure_days // 30))

    score_int = int(max(0, min(100, round(score))))

    # ---- Band -------------------------------------------------------------
    late_now = c.overdue_amount > 0 and c.days_late_now > 0

    if not has_history and not late_now:
        # Too little history to judge: neither trust nor penalise.
        band = "new"
        reasons.insert(0, _reason("new_customer", 1))
    elif score_int >= LOW_RISK_MIN:
        band = "low"
    elif score_int >= MEDIUM_RISK_MIN:
        band = "medium"
    else:
        band = "high"

    # ---- Suggested credit limit ------------------------------------------
    if band == "new":
        limit = starter_limit
    elif band == "high" and late_now:
        # Don't extend more until the late money comes in.
        limit = 0.0
        reasons.append(_reason("stop_credit", -1))
    else:
        months = max(1.0, c.tenure_days / 30)
        monthly_paid = c.total_paid / months
        limit = max(float(MIN_LIMIT), _round_to(monthly_paid * LIMIT_FACTOR[band]))
        reasons.append(_reason("pays_monthly", 1, amount=_round_to(monthly_paid)))

    # Most damaging reasons first, then the positives.
    reasons.sort(key=lambda r: r.impact)

    return CustomerRisk(
        id=c.id,
        score=score_int,
        band=band,
        suggested_limit=limit,
        reasons=reasons,
    )


def score_customers(customers: list[CustomerRiskFeatures], starter_limit: float):
    return [score_customer(customer, starter_limit) for customer in customers]
