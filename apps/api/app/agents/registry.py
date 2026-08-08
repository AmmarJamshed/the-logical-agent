from app.agents.base.agent import BaseAgent
from app.agents.discovery.agents import (
    AIResearchAgent,
    BlockchainAgent,
    CertificationDiscoveryAgent,
    CloudComputingAgent,
    ConferenceAgent,
    CourseDiscoveryAgent,
    CybersecurityAgent,
    FundingAgent,
    GlobalTechNewsAgent,
    GovernmentPolicyAgent,
    HackathonAgent,
    OpenSourceAgent,
    ProgrammingLanguagesAgent,
    QuantumComputingAgent,
    ResearchPaperAgent,
    SoftwareEngineeringAgent,
    StartupIntelligenceAgent,
    UniversityAgent,
    VentureCapitalAgent,
)
from app.agents.distribution.agents import DistributionFormatterAgent
from app.agents.editorial.agents import (
    AnalyticsAgent,
    CommunityModerationAgent,
    EditorialAgent,
    FactVerificationAgent,
    ImageGenerationAgent,
    NewsletterAgent,
    SEOAgent,
    TranslationAgent,
)
from app.agents.orchestration.publisher import PublishingOrchestratorAgent
from app.core.enums import AgentType

AGENT_REGISTRY: dict[AgentType, type[BaseAgent]] = {
    AgentType.GLOBAL_TECH_NEWS: GlobalTechNewsAgent,
    AgentType.AI_RESEARCH: AIResearchAgent,
    AgentType.RESEARCH_PAPER: ResearchPaperAgent,
    AgentType.STARTUP_INTELLIGENCE: StartupIntelligenceAgent,
    AgentType.VENTURE_CAPITAL: VentureCapitalAgent,
    AgentType.FUNDING: FundingAgent,
    AgentType.QUANTUM: QuantumComputingAgent,
    AgentType.CYBERSECURITY: CybersecurityAgent,
    AgentType.BLOCKCHAIN: BlockchainAgent,
    AgentType.OPEN_SOURCE: OpenSourceAgent,
    AgentType.SOFTWARE_ENGINEERING: SoftwareEngineeringAgent,
    AgentType.PROGRAMMING_LANGUAGES: ProgrammingLanguagesAgent,
    AgentType.CLOUD: CloudComputingAgent,
    AgentType.UNIVERSITY: UniversityAgent,
    AgentType.COURSE_DISCOVERY: CourseDiscoveryAgent,
    AgentType.CERTIFICATION: CertificationDiscoveryAgent,
    AgentType.GOVERNMENT_POLICY: GovernmentPolicyAgent,
    AgentType.CONFERENCE: ConferenceAgent,
    AgentType.HACKATHON: HackathonAgent,
    AgentType.SEO: SEOAgent,
    AgentType.EDITORIAL: EditorialAgent,
    AgentType.FACT_VERIFICATION: FactVerificationAgent,
    AgentType.IMAGE_GENERATION: ImageGenerationAgent,
    AgentType.NEWSLETTER: NewsletterAgent,
    AgentType.TRANSLATION: TranslationAgent,
    AgentType.ANALYTICS: AnalyticsAgent,
    AgentType.COMMUNITY_MODERATION: CommunityModerationAgent,
    AgentType.PUBLISHING_ORCHESTRATOR: PublishingOrchestratorAgent,
}


def get_agent(agent_type: AgentType) -> BaseAgent:
    cls = AGENT_REGISTRY.get(agent_type)
    if cls is None:
        raise KeyError(f"Unknown agent type: {agent_type}")
    if agent_type == AgentType.PUBLISHING_ORCHESTRATOR:
        return PublishingOrchestratorAgent()
    # Distribution formatter shares orchestrator enum for channel packs when needed
    if cls is DistributionFormatterAgent:
        return DistributionFormatterAgent()
    return cls()
