from enum import StrEnum


class UserRole(StrEnum):
    READER = "reader"
    CREATOR = "creator"
    EDITOR = "editor"
    MODERATOR = "moderator"
    ADVERTISER = "advertiser"
    BUSINESS = "business"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"


class SubscriptionPlan(StrEnum):
    FREE = "free"
    PRO = "pro"
    BUSINESS = "business"
    ENTERPRISE = "enterprise"


class ArticleStatus(StrEnum):
    DRAFT = "draft"
    RESEARCH = "research"
    FACT_CHECK = "fact_check"
    EDITORIAL = "editorial"
    SEO = "seo"
    IMAGE = "image"
    QUEUED = "queued"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    REJECTED = "rejected"


class ArticleType(StrEnum):
    BREAKING = "breaking"
    ANALYSIS = "analysis"
    EDITORIAL = "editorial"
    OPINION = "opinion"
    WEEKLY_REPORT = "weekly_report"
    MONTHLY_REPORT = "monthly_report"
    EXPLAINER = "explainer"
    FORECAST = "forecast"
    SPONSORED = "sponsored"
    USER = "user"
    RESEARCH_SUMMARY = "research_summary"
    STARTUP = "startup"


class AgentType(StrEnum):
    GLOBAL_TECH_NEWS = "global_tech_news"
    AI_RESEARCH = "ai_research"
    RESEARCH_PAPER = "research_paper"
    STARTUP_INTELLIGENCE = "startup_intelligence"
    VENTURE_CAPITAL = "venture_capital"
    FUNDING = "funding"
    QUANTUM = "quantum"
    CYBERSECURITY = "cybersecurity"
    BLOCKCHAIN = "blockchain"
    OPEN_SOURCE = "open_source"
    SOFTWARE_ENGINEERING = "software_engineering"
    PROGRAMMING_LANGUAGES = "programming_languages"
    CLOUD = "cloud"
    UNIVERSITY = "university"
    COURSE_DISCOVERY = "course_discovery"
    CERTIFICATION = "certification"
    GOVERNMENT_POLICY = "government_policy"
    CONFERENCE = "conference"
    HACKATHON = "hackathon"
    SEO = "seo"
    EDITORIAL = "editorial"
    FACT_VERIFICATION = "fact_verification"
    IMAGE_GENERATION = "image_generation"
    NEWSLETTER = "newsletter"
    TRANSLATION = "translation"
    ANALYTICS = "analytics"
    COMMUNITY_MODERATION = "community_moderation"
    PUBLISHING_ORCHESTRATOR = "publishing_orchestrator"


class AgentRunStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"


class CourseModality(StrEnum):
    ONLINE = "online"
    PHYSICAL = "physical"
    HYBRID = "hybrid"


class DifficultyLevel(StrEnum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class PaymentStatus(StrEnum):
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class AdPlacement(StrEnum):
    BANNER = "banner"
    SIDEBAR = "sidebar"
    NATIVE = "native"
    NEWSLETTER = "newsletter"
    HOMEPAGE_TAKEOVER = "homepage_takeover"
    CATEGORY = "category"
    SEARCH = "search"
    AI_RECOMMENDATION = "ai_recommendation"


class DistributionChannel(StrEnum):
    WEBSITE = "website"
    EMAIL = "email"
    FACEBOOK = "facebook"
    LINKEDIN_COMPANY = "linkedin_company"
    LINKEDIN_PERSONAL = "linkedin_personal"
    TWITTER = "twitter"
    TELEGRAM = "telegram"
    DISCORD = "discord"
    RSS = "rss"


class NewsletterFrequency(StrEnum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
