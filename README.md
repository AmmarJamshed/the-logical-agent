# The Logical Agent

**Technology. Research. Intelligence.**

The Logical Agent is a production-oriented, AI-native media, research, and social networking platform. Autonomous agents continuously discover, verify, analyze, and publish developments across AI, technology, research, startups, education, and digital innovation.

> Become the Bloomberg of Technology.

## Architecture

```
apps/
  api/          FastAPI · PostgreSQL · Redis · Celery · Elasticsearch · LangGraph agents
  web/          Next.js · React · TypeScript · Tailwind
infra/          Docker · Kubernetes · Nginx · Prometheus
docs/           Architecture, API, deployment, agents
```

### Publishing pipeline

Research → Fact Verification → Editorial AI → SEO → Image Generation → Publishing Queue → Distribution → Analytics

### Distribution channels

Website · Email · Facebook · LinkedIn · X · Telegram · Discord · RSS

## Free APIs (default)

Agents use **free-first** LLM + data APIs. See [docs/agents/FREE_APIS.md](docs/agents/FREE_APIS.md).

Recommended: set a free **Groq** key in `.env` (`GROQ_API_KEY`), or run **Ollama** locally. Discovery pulls from Hacker News, arXiv, Semantic Scholar, and RSS (no paid news API required).

### Prerequisites

- Docker & Docker Compose
- Make (optional)
- Node 20+ and Python 3.12+ for local (non-Docker) development

### 1. Configure environment

```bash
cp .env.example .env
```

Set at least `SECRET_KEY` and any LLM provider keys you want to use. Agents run in offline fallback mode without LLM keys.

### 2. Start the stack

```bash
docker compose up -d postgres redis elasticsearch minio minio-init mailhog
docker compose up -d --build api worker beat web
```

Or: `make up`

### 3. Migrate & seed

```bash
docker compose exec api alembic upgrade head
docker compose exec api python -m scripts.seed
```

### 4. Open the product

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API docs | http://localhost:8000/docs |
| Mailhog | http://localhost:8025 |
| MinIO | http://localhost:9001 |

**Seed accounts**

- Admin: `admin@thelogicalagent.com` / `ChangeMeAdmin123!`
- Editor: `editor@thelogicalagent.com` / `ChangeMeEditor123!`

## Core capabilities

- **Multi-agent newsroom** — 27 specialized agents with Celery scheduling and a publishing orchestrator
- **Course discovery** — filter by country, technology, provider, modality, price, difficulty, language
- **Research intelligence** — multi-audience summaries from academic sources
- **Startup & funding desk** — rounds, market analysis, timelines
- **Semantic AI search** — natural language over the live knowledge graph
- **Country & topic dashboards**
- **Social network** — profiles, communities, posts, debate rooms, messaging APIs
- **Newsletter engine** — daily / weekly / monthly HTML templates with personalization hooks
- **Monetization** — subscriptions, ads, sponsored content, jobs, marketplace, affiliates
- **Admin & security** — RBAC, JWT, MFA hooks, OAuth stubs, audit logs, rate-limit config, GDPR consent fields

## API surface (v1)

| Area | Prefix |
|------|--------|
| Auth | `/api/v1/auth` |
| Articles | `/api/v1/articles` |
| Courses | `/api/v1/courses` |
| Search | `/api/v1/search` |
| Social | `/api/v1/social` |
| Companies / research / funding / jobs | `/api/v1/companies`, `/research`, `/funding`, `/jobs` |
| Dashboards / agents / billing / admin | `/api/v1/dashboards/*`, `/agents`, `/billing`, `/admin` |

Full interactive docs: `/docs` and `/redoc`.

## Development

```bash
# Backend tests
cd apps/api && pip install -r requirements.txt && pytest -q

# Frontend
cd apps/web && npm install && npm run dev
```

Useful Make targets: `up`, `down`, `migrate`, `seed`, `test`, `lint`, `logs`, `observability`.

## Deployment

See [docs/deployment/DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md).

Kubernetes-ready manifests live under `infra/k8s/`. Production Compose overrides: `docker-compose.prod.yml`.

## Documentation

- [Architecture](docs/architecture/OVERVIEW.md)
- [Agents](docs/agents/FLEET.md)
- [API notes](docs/api/README.md)
- [Deployment](docs/deployment/DEPLOYMENT.md)

## Security baseline

- JWT access + refresh tokens
- Password hashing (bcrypt)
- MFA (TOTP) support
- RBAC permission matrix
- Security response headers
- Audit logging model
- GDPR consent timestamp on registration
- Secrets via environment / K8s secrets (never commit `.env`)

## License

Proprietary — all rights reserved unless otherwise stated by the project owner.
