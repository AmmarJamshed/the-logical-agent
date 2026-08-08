from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.enums import PaymentStatus, SubscriptionPlan
from app.models.monetization import Advertisement, Payment, Subscription
from app.models.user import User

settings = get_settings()

PLAN_PRICES = {
    SubscriptionPlan.FREE: Decimal("0"),
    SubscriptionPlan.PRO: Decimal("29"),
    SubscriptionPlan.BUSINESS: Decimal("199"),
    SubscriptionPlan.ENTERPRISE: Decimal("999"),
}


class MonetizationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_subscription(self, user: User, plan: SubscriptionPlan) -> Subscription:
        if plan == SubscriptionPlan.FREE:
            user.plan = SubscriptionPlan.FREE
            sub = Subscription(user_id=user.id, plan=plan, status="active")
            self.db.add(sub)
            await self.db.flush()
            return sub

        amount = PLAN_PRICES[plan]
        payment = Payment(
            user_id=user.id,
            amount=amount,
            currency="USD",
            status=PaymentStatus.PENDING,
            provider="stripe" if settings.stripe_secret_key else "simulated",
            product_type="subscription",
            product_id=plan.value,
        )
        self.db.add(payment)

        # In production: create Stripe Checkout / subscription objects.
        if not settings.stripe_secret_key:
            payment.status = PaymentStatus.SUCCEEDED
            user.plan = plan
            sub = Subscription(user_id=user.id, plan=plan, status="active")
            self.db.add(sub)
            await self.db.flush()
            return sub

        import stripe

        stripe.api_key = settings.stripe_secret_key
        customer = user.stripe_customer_id
        if not customer:
            created = stripe.Customer.create(email=user.email, metadata={"user_id": str(user.id)})
            customer = created["id"]
            user.stripe_customer_id = customer
        # Caller should redirect to Checkout; here we record intent.
        payment.provider_payment_id = f"intent-{user.id}-{plan.value}"
        await self.db.flush()
        sub = Subscription(user_id=user.id, plan=plan, status="pending")
        self.db.add(sub)
        await self.db.flush()
        return sub

    async def record_ad_impression(self, ad_id: UUID) -> Advertisement | None:
        ad = (await self.db.execute(select(Advertisement).where(Advertisement.id == ad_id))).scalar_one_or_none()
        if not ad:
            return None
        ad.impressions += 1
        return ad

    async def record_ad_click(self, ad_id: UUID) -> Advertisement | None:
        ad = (await self.db.execute(select(Advertisement).where(Advertisement.id == ad_id))).scalar_one_or_none()
        if not ad:
            return None
        ad.clicks += 1
        return ad

    async def revenue_summary(self) -> dict:
        payments = (
            await self.db.execute(select(Payment).where(Payment.status == PaymentStatus.SUCCEEDED))
        ).scalars().all()
        by_source: dict[str, float] = {}
        total = 0.0
        for p in payments:
            by_source[p.product_type] = by_source.get(p.product_type, 0.0) + float(p.amount)
            total += float(p.amount)
        return {"total_revenue": total, "by_source": by_source, "payment_count": len(payments)}
