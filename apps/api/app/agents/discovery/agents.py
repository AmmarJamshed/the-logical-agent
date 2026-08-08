"""LLM-backed discovery and domain agents — powered by free public data APIs."""

from __future__ import annotations

import json

from app.agents.base.agent import AgentContext, AgentResult, BaseAgent
from app.core.enums import AgentType
from app.services.free_sources import discover_for_domain, fetch_arxiv


class DiscoveryAgent(BaseAgent):
    """Template for continuous domain monitoring agents."""

    domain: str = "technology"
    sources: list[str] = []

    async def execute(self, context: AgentContext) -> AgentResult:
        system = (
            f"You are the {self.name} for The Logical Agent. "
            "Discover, verify, and summarize the latest developments from the provided free source data. "
            "Return structured intelligence suitable for publication."
        )
        focus = context.payload.get("focus", self.domain)
        sourced = await discover_for_domain(self.domain, focus=str(focus) if focus else None)
        # Keep prompt compact for free-tier rate limits
        compact = [
            {
                "title": i.get("title"),
                "url": i.get("url"),
                "source": i.get("source"),
                "summary": (i.get("summary") or i.get("abstract") or "")[:280],
            }
            for i in sourced[:12]
        ]
        prompt = (
            f"Monitor domain: {self.domain}\n"
            f"Focus: {focus}\n"
            f"Preferred sources: {', '.join(self.sources) or 'free public APIs'}\n"
            f"Live source items (JSON):\n{json.dumps(compact, ensure_ascii=False)}\n\n"
            "Produce: title, summary, key facts, sources, confidence (0-1), technologies, countries."
        )
        text, tokens = await self.generate_text(prompt, system=system)
        artifact = {
            "kind": "intel_brief",
            "domain": self.domain,
            "content": text,
            "focus": focus,
            "source_count": len(sourced),
        }
        return AgentResult(
            success=True,
            agent_type=self.agent_type,
            output={"brief": text, "domain": self.domain, "sources_fetched": len(sourced), "items": compact},
            artifacts=[artifact],
            tokens_used=tokens,
        )


class GlobalTechNewsAgent(DiscoveryAgent):
    agent_type = AgentType.GLOBAL_TECH_NEWS
    name = "Global Technology News Agent"
    domain = "global technology"
    sources = ["hacker_news", "rss", "arxiv"]


class AIResearchAgent(DiscoveryAgent):
    agent_type = AgentType.AI_RESEARCH
    name = "AI Research Agent"
    domain = "artificial intelligence research"
    sources = ["arxiv", "semantic_scholar", "hacker_news"]


class ResearchPaperAgent(DiscoveryAgent):
    agent_type = AgentType.RESEARCH_PAPER
    name = "Research Paper Agent"
    domain = "research papers"
    sources = ["arxiv", "semantic_scholar"]

    async def execute(self, context: AgentContext) -> AgentResult:
        paper = context.payload.get("paper", {})
        if not paper and context.payload.get("query"):
            papers = await fetch_arxiv(query=f"all:{context.payload['query']}", max_results=3)
            paper = papers[0] if papers else {}
        system = "Generate multi-audience research intelligence summaries from free academic sources."
        prompt = (
            "Create executive summary, beginner version, technical version, "
            "key findings, business impact, and future predictions for:\n"
            f"Title: {paper.get('title', 'Unknown')}\n"
            f"Abstract: {paper.get('abstract', context.payload.get('abstract', ''))}\n"
            f"URL: {paper.get('url', '')}"
        )
        text, tokens = await self.generate_text(prompt, system=system)
        return AgentResult(
            success=True,
            agent_type=self.agent_type,
            output={"summaries": text, "paper": paper},
            artifacts=[{"kind": "research_summary", "content": text}],
            tokens_used=tokens,
        )


class StartupIntelligenceAgent(DiscoveryAgent):
    agent_type = AgentType.STARTUP_INTELLIGENCE
    name = "Startup Intelligence Agent"
    domain = "startups"


class VentureCapitalAgent(DiscoveryAgent):
    agent_type = AgentType.VENTURE_CAPITAL
    name = "Venture Capital Agent"
    domain = "venture capital"


class FundingAgent(DiscoveryAgent):
    agent_type = AgentType.FUNDING
    name = "Funding Agent"
    domain = "funding rounds"


class QuantumComputingAgent(DiscoveryAgent):
    agent_type = AgentType.QUANTUM
    name = "Quantum Computing Agent"
    domain = "quantum computing"


class CybersecurityAgent(DiscoveryAgent):
    agent_type = AgentType.CYBERSECURITY
    name = "Cybersecurity Agent"
    domain = "cybersecurity"


class BlockchainAgent(DiscoveryAgent):
    agent_type = AgentType.BLOCKCHAIN
    name = "Blockchain Agent"
    domain = "blockchain and web3"


class OpenSourceAgent(DiscoveryAgent):
    agent_type = AgentType.OPEN_SOURCE
    name = "Open Source Agent"
    domain = "open source"


class SoftwareEngineeringAgent(DiscoveryAgent):
    agent_type = AgentType.SOFTWARE_ENGINEERING
    name = "Software Engineering Agent"
    domain = "software engineering"


class ProgrammingLanguagesAgent(DiscoveryAgent):
    agent_type = AgentType.PROGRAMMING_LANGUAGES
    name = "Programming Languages Agent"
    domain = "programming languages"


class CloudComputingAgent(DiscoveryAgent):
    agent_type = AgentType.CLOUD
    name = "Cloud Computing Agent"
    domain = "cloud computing"


class UniversityAgent(DiscoveryAgent):
    agent_type = AgentType.UNIVERSITY
    name = "University Agent"
    domain = "universities and academic programs"


class CourseDiscoveryAgent(DiscoveryAgent):
    agent_type = AgentType.COURSE_DISCOVERY
    name = "Course Discovery Agent"
    domain = "online courses and learning programs"


class CertificationDiscoveryAgent(DiscoveryAgent):
    agent_type = AgentType.CERTIFICATION
    name = "Certification Discovery Agent"
    domain = "professional certifications"


class GovernmentPolicyAgent(DiscoveryAgent):
    agent_type = AgentType.GOVERNMENT_POLICY
    name = "Government Policy Agent"
    domain = "government digital policies"


class ConferenceAgent(DiscoveryAgent):
    agent_type = AgentType.CONFERENCE
    name = "Conference Agent"
    domain = "technology conferences"


class HackathonAgent(DiscoveryAgent):
    agent_type = AgentType.HACKATHON
    name = "Hackathon Agent"
    domain = "hackathons and competitions"
