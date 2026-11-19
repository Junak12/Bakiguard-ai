from app.models.ai_models import DashboardInsightRequest


def _insight(type_, code, title, message, params=None, **extra):
    """One insight.

    `code` + `params` let the app show the insight in any language;
    `title`/`message` are an English fallback for other clients.
    """
    return {
        "type": type_,
        "code": code,
        "params": params or {},
        "title": title,
        "message": message,
        **extra,
    }


def generate_dashboard_insights(data: DashboardInsightRequest):
    insights = []

    # Most urgent first: money that is already late.
    if data.total_overdue > 0:
        insights.append(
            _insight(
                "warning",
                "overdue_baki",
                "Overdue Baki",
                f"৳{data.total_overdue:,.0f} is past its due date "
                f"across {data.overdue_customers} customer(s). Collect these first.",
                {"amount": data.total_overdue, "count": data.overdue_customers},
            )
        )

    if data.total_baki > 0:
        insights.append(
            _insight(
                "info" if data.total_overdue > 0 else "warning",
                "outstanding_baki",
                "Outstanding Baki",
                f"You currently have ৳{data.total_baki:,.0f} in outstanding Baki.",
                {"amount": data.total_baki},
            )
        )

    top = max(data.customers, key=lambda customer: customer.baki, default=None)

    if top is not None and top.baki > 0:
        insights.append(
            _insight(
                "customer",
                "top_customer",
                "Highest Outstanding Balance",
                f"{top.name} has the highest outstanding Baki of ৳{top.baki:,.0f}.",
                {"name": top.name, "amount": top.baki},
                customer=top.name,
            )
        )

    if data.total_payment > 0:
        insights.append(
            _insight(
                "positive",
                "payment_activity",
                "Payment Activity",
                f"You have collected ৳{data.total_payment:,.0f} from customers.",
                {"amount": data.total_payment},
            )
        )

    if data.total_customers == 0:
        insights.append(
            _insight(
                "info",
                "getting_started",
                "Getting Started",
                "You don't have any customers yet. "
                "Add your first customer to start tracking Baki.",
            )
        )

    return {
        "insights": insights,
        "summary": {
            "total_customers": data.total_customers,
            "total_credit": data.total_credit,
            "total_payment": data.total_payment,
            "total_baki": data.total_baki,
            "total_overdue": data.total_overdue,
        },
    }
