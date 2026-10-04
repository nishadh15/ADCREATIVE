from ..database.base import *  # noqa
from sqlalchemy import ForeignKey, String, Integer, Float, Boolean, Text, Date, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from datetime import date, datetime

def fk(t): return mapped_column(Integer, ForeignKey(f"{t}.id", ondelete="CASCADE"), index=True)
def s(n=255, **k): return mapped_column(String(n), **k)

class User(Stamped, Base):
    __tablename__ = "users"
    email: Mapped[str] = s(unique=True, index=True)
    password_hash: Mapped[str] = s()
    role: Mapped[str] = s(20, default="owner")

class Brand(Stamped, Base):
    __tablename__ = "brands"
    user_id: Mapped[int] = fk("users")
    name: Mapped[str] = s()
    profile: Mapped[dict | None] = mapped_column(JSON)  # tone, audience, locations

class InstagramAccount(Sourced, Base):
    __tablename__ = "instagram_accounts"
    brand_id: Mapped[int] = fk("brands")
    username: Mapped[str] = s()
    ig_user_id: Mapped[str | None] = s(64)
    token_ref: Mapped[str | None] = s(128)  # reference to secret store, NEVER the token itself
    status: Mapped[str] = s(20, default="not_connected")

class InstagramPost(Sourced, Base):
    __tablename__ = "instagram_posts"
    account_id: Mapped[int] = fk("instagram_accounts")
    ig_media_id: Mapped[str | None] = s(64, index=True)
    media_type: Mapped[str] = s(20)  # image|carousel|story
    caption: Mapped[str | None] = mapped_column(Text)
    hook: Mapped[str | None] = s(300)
    cta: Mapped[str | None] = s(200)
    product_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("products.id"))
    posted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    metrics: Mapped[dict | None] = mapped_column(JSON)  # reach, likes, saves, shares...

class InstagramReel(Sourced, Base):
    __tablename__ = "instagram_reels"
    account_id: Mapped[int] = fk("instagram_accounts")
    ig_media_id: Mapped[str | None] = s(64, index=True)
    hook: Mapped[str | None] = s(300)
    audio: Mapped[str | None] = s(200)
    duration_sec: Mapped[int | None] = mapped_column(Integer)
    posted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    metrics: Mapped[dict | None] = mapped_column(JSON)  # views, watch_time, retention...

class Analytics(Sourced, Base):
    """Daily account-level snapshot -> history for growth + learning."""
    __tablename__ = "analytics"
    account_id: Mapped[int] = fk("instagram_accounts")
    day: Mapped[date] = mapped_column(Date, index=True)
    followers: Mapped[int | None] = mapped_column(Integer)
    reach: Mapped[int | None] = mapped_column(Integer)
    impressions: Mapped[int | None] = mapped_column(Integer)
    profile_visits: Mapped[int | None] = mapped_column(Integer)
    website_clicks: Mapped[int | None] = mapped_column(Integer)
    dms: Mapped[int | None] = mapped_column(Integer)
    extra: Mapped[dict | None] = mapped_column(JSON)  # demographics, locations, activity

class Product(Stamped, Base):
    __tablename__ = "products"
    brand_id: Mapped[int] = fk("brands")
    name: Mapped[str] = s()
    category: Mapped[str] = s(50)
    price_inr: Mapped[float | None] = mapped_column(Float)

class ContentCalendar(Sourced, Base):
    __tablename__ = "content_calendar"
    brand_id: Mapped[int] = fk("brands")
    scheduled_for: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    content_type: Mapped[str] = s(30)
    objective: Mapped[str] = s(30)
    product_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("products.id"))
    details: Mapped[dict | None] = mapped_column(JSON)  # hook, caption, cta, hashtags, audio
    status: Mapped[str] = s(20, default="draft")

class ContentIdea(Sourced, Base):
    __tablename__ = "content_ideas"
    brand_id: Mapped[int] = fk("brands")
    kind: Mapped[str] = s(30)
    body: Mapped[dict] = mapped_column(JSON)

class Hashtag(Sourced, Base):
    __tablename__ = "hashtags"
    tag: Mapped[str] = s(100, index=True)
    category: Mapped[str] = s(30)  # high-volume|medium|low-competition|niche|...
    performance: Mapped[dict | None] = mapped_column(JSON)

class Trend(Sourced, Base):
    __tablename__ = "trends"
    name: Mapped[str] = s(200)
    score: Mapped[int | None] = mapped_column(Integer)
    detail: Mapped[dict | None] = mapped_column(JSON)
    observed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)

class Competitor(Sourced, Base):
    __tablename__ = "competitors"
    brand_id: Mapped[int] = fk("brands")
    username: Mapped[str] = s()
    notes: Mapped[dict | None] = mapped_column(JSON)

class AdCampaign(Sourced, Base):
    __tablename__ = "ad_campaigns"
    brand_id: Mapped[int] = fk("brands")
    name: Mapped[str] = s()
    objective: Mapped[str] = s(30)
    status: Mapped[str] = s(20, default="draft")
    plan: Mapped[dict | None] = mapped_column(JSON)

class AdCreative(Sourced, Base):
    __tablename__ = "ad_creatives"
    campaign_id: Mapped[int] = fk("ad_campaigns")
    hook_type: Mapped[str | None] = s(30)
    copy: Mapped[dict | None] = mapped_column(JSON)

class AdPerformance(Sourced, Base):
    __tablename__ = "ad_performance"
    campaign_id: Mapped[int] = fk("ad_campaigns")
    day: Mapped[date] = mapped_column(Date, index=True)
    spend: Mapped[float | None] = mapped_column(Float)
    impressions: Mapped[int | None] = mapped_column(Integer)
    clicks: Mapped[int | None] = mapped_column(Integer)
    conversions: Mapped[int | None] = mapped_column(Integer)
    revenue: Mapped[float | None] = mapped_column(Float)

class AIRecommendation(Stamped, Base):
    __tablename__ = "ai_recommendations"
    brand_id: Mapped[int] = fk("brands")
    module: Mapped[str] = s(40)
    output: Mapped[dict] = mapped_column(JSON)
    inputs_ref: Mapped[dict | None] = mapped_column(JSON)  # what data it was based on
    outcome: Mapped[dict | None] = mapped_column(JSON)  # filled later -> learning loop

class MarketingReport(Stamped, Base):
    __tablename__ = "marketing_reports"
    brand_id: Mapped[int] = fk("brands")
    period: Mapped[str] = s(20)
    body: Mapped[dict] = mapped_column(JSON)

class PendingAction(Stamped, Base):
    """Approval queue: nothing publishes, spends or changes campaigns until approved."""
    __tablename__ = "pending_actions"
    brand_id: Mapped[int] = fk("brands")
    action: Mapped[str] = s(40)
    what_will_happen: Mapped[str] = mapped_column(Text)
    cost_inr: Mapped[float] = mapped_column(Float, default=0)
    payload: Mapped[dict | None] = mapped_column(JSON)
    scheduled_for: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    requires_approval: Mapped[bool] = mapped_column(Boolean, default=True)
    status: Mapped[str] = s(20, default="pending")  # pending|approved|rejected|executed
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
