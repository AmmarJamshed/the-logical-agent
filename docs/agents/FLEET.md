# Agent Fleet

All agents implement `BaseAgent` and register under `AgentType`.

## Discovery / domain agents

| Agent | Focus |
|-------|-------|
| Global Technology News | Cross-domain tech news |
| AI Research | AI labs & model releases |
| Research Paper | Academic summarization |
| Startup Intelligence | Startup landscape |
| Venture Capital | VC activity |
| Funding | Rounds, IPOs, acquisitions |
| Quantum / Cyber / Blockchain / OSS / SWE / Languages / Cloud | Vertical desks |
| University / Course / Certification | Education discovery |
| Government Policy | Digital policy |
| Conference / Hackathon | Events |

## Editorial & platform agents

| Agent | Role |
|-------|------|
| Fact Verification | Claim checking + confidence |
| Editorial | Voice, structure, clarity |
| SEO | Titles, meta, keywords |
| Image Generation | Hero concepts / assets |
| Newsletter | Personalized briefing copy |
| Translation | Multilingual packaging |
| Analytics | Metric narratives |
| Community Moderation | Spam / abuse triage |
| Publishing Orchestrator | End-to-end pipeline |

## Schedules (Celery Beat)

Defined in `app/workers/celery_app.py` — hourly news, periodic research/funding, daily course discovery, daily/weekly newsletters.

## Running an agent manually

```http
POST /api/v1/agents/{agent_type}/run
Authorization: Bearer <admin-token>
```

Requires `agents:control` permission.
