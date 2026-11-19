from app.models.ai_models import DashboardInsightRequest


def generate_dashboard_insights(
    data: DashboardInsightRequest,
):
    insights = []

    # -----------------------------------------
    # TOTAL BAKI
    # -----------------------------------------

    if data.total_baki > 0:
        insights.append({
            "type": "warning",
            "title": "Outstanding Baki",
            "message": (
                f"You currently have "
                f"৳{data.total_baki:,.0f} "
                f"in outstanding Baki."
            ),
        })

    # -----------------------------------------
    # HIGH BAKI CUSTOMER
    # -----------------------------------------

    high_baki_customers = sorted(
        data.customers,
        key=lambda customer: customer.baki,
        reverse=True,
    )

    if high_baki_customers:
        top_customer = high_baki_customers[0]

        if top_customer.baki > 0:
            insights.append({
                "type": "customer",
                "title": "Highest Outstanding Balance",
                "message": (
                    f"{top_customer.name} has the "
                    f"highest outstanding Baki of "
                    f"৳{top_customer.baki:,.0f}."
                ),
                "customer": top_customer.name,
            })

    # -----------------------------------------
    # PAYMENT ACTIVITY
    # -----------------------------------------

    if data.total_payment > 0:
        insights.append({
            "type": "positive",
            "title": "Payment Activity",
            "message": (
                f"You have collected "
                f"৳{data.total_payment:,.0f} "
                f"from customers."
            ),
        })

    # -----------------------------------------
    # NO CUSTOMERS
    # -----------------------------------------

    if data.total_customers == 0:
        insights.append({
            "type": "info",
            "title": "Getting Started",
            "message": (
                "You don't have any customers yet. "
                "Add your first customer to start "
                "tracking Baki."
            ),
        })

    return {
        "insights": insights,
        "summary": {
            "total_customers": data.total_customers,
            "total_credit": data.total_credit,
            "total_payment": data.total_payment,
            "total_baki": data.total_baki,
        },
    }