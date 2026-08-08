# Architecture Overview

## System context

The Logical Agent is a modular monorepo:

1. **Web (Next.js)** — public site, dashboards, social surfaces, admin shell, monetization pages
2. **API (FastAPI)** — auth, content, discovery, search, social, billing, agent control plane
3. **Workers (Celery)** — scheduled discovery agents, publishing pipeline, newsletters
4. **Data plane** — PostgreSQL (system of record), Redis (queue/cache), Elasticsearch (search), MinIO (media)

## Domain modules

| Module | Responsibility |
|--------|----------------|
| Identity | Users, OAuth, MFA, RBAC, audit |
| Newsroom | Articles, categories, SEO, pipeline state |
| Discovery | Courses, universities, conferences |
| Intelligence | Research papers, funding, companies |
| Social | Communities, posts, DMs, debates |
| Monetization | Plans, ads, jobs, affiliates, marketplace |
| Agents | Registry, runs, orchestration, distribution jobs |
| Knowledge graph | Entities + relations for semantic search |

## Agent communication

Agents are independent classes registered in `app/agents/registry.py`. They communicate through:

- Shared `AgentContext` / `AgentResult` contracts
- Celery tasks for async execution
- The **Publishing Orchestrator**, which chains fact-check → editorial → SEO → image → distribution packs
- Persistence of runs in `agent_runs` for monitoring

## Scalability notes

- Stateless API replicas behind a load balancer
- Horizontal Celery workers
- Postgres connection pooling
- Object storage + CDN for media
- Elasticsearch indexes prefixed by `ELASTICSEARCH_INDEX_PREFIX`
- K8s Deployment sample with readiness/liveness probes

## Security layers

1. Transport security headers + HSTS in production
2. JWT + optional MFA
3. Permission checks via `require_permission`
4. Audit log writes on sensitive auth events
5. Rate limit configuration (wire to Redis gateway / middleware in edge)
