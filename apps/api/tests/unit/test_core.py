import pytest
from httpx import ASGITransport, AsyncClient

from app.core.enums import AgentType
from app.agents.registry import AGENT_REGISTRY, get_agent
from app.services.search import interpret_query


def test_all_required_agents_registered():
    required = {
        AgentType.GLOBAL_TECH_NEWS,
        AgentType.AI_RESEARCH,
        AgentType.RESEARCH_PAPER,
        AgentType.STARTUP_INTELLIGENCE,
        AgentType.COURSE_DISCOVERY,
        AgentType.FACT_VERIFICATION,
        AgentType.EDITORIAL,
        AgentType.SEO,
        AgentType.IMAGE_GENERATION,
        AgentType.NEWSLETTER,
        AgentType.PUBLISHING_ORCHESTRATOR,
    }
    assert required.issubset(set(AGENT_REGISTRY.keys()))


def test_interpret_course_query_germany():
    result = interpret_query("Show cybersecurity certifications in Germany")
    assert "courses" in result["intents"]
    assert "DE" in result["countries"]
    assert any("cyber" in t for t in result["technologies"])


@pytest.mark.asyncio
async def test_agent_offline_execution():
    agent = get_agent(AgentType.GLOBAL_TECH_NEWS)
    from app.agents.base.agent import AgentContext

    result = await agent.run(AgentContext(payload={"focus": "llm agents"}))
    assert result.success is True
    assert result.artifacts


@pytest.mark.asyncio
async def test_health_endpoint():
    pytest.importorskip("slugify")
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
