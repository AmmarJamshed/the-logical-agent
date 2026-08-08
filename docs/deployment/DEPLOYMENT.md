# Deployment Guide

## Local / staging (Compose)

1. Copy `.env.example` → `.env` and set production secrets.
2. `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`
3. Run migrations & seed (seed only for non-prod demos).
4. Put Nginx (`infra/nginx/default.conf`) or a cloud LB in front.
5. Enable TLS at the edge (Cloudflare, Traefik, or cert-manager).

## Kubernetes

1. Create namespace `tla`.
2. Create secret `tla-secrets` from your env file.
3. Apply `infra/k8s/api-deployment.yaml` (extend with worker/beat/web Deployments similarly).
4. Provision managed Postgres, Redis, Elasticsearch, and S3-compatible storage.
5. Configure ingress for web + `/api` path routing.

## CI/CD

GitHub Actions workflow `.github/workflows/ci.yml`:

- Lint + unit test API
- Lint + build web
- Build Docker images on `main`

Extend with registry push + deploy jobs for your environment.

## Observability

```bash
docker compose --profile observability up -d
```

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin / admin)

API metrics: `/metrics`

## Backups

- Postgres: continuous WAL or nightly `pg_dump`
- MinIO/S3: versioned bucket replication
- Redis: AOF enabled in Compose

## Checklist before production

- [ ] Rotate `SECRET_KEY` and DB passwords
- [ ] Configure OAuth client IDs/secrets
- [ ] Configure Stripe/PayPal webhooks
- [ ] Set LLM provider keys and budgets
- [ ] Configure social distribution credentials
- [ ] Enable Sentry
- [ ] Restrict CORS origins
- [ ] Confirm GDPR privacy policy + data export/delete runbooks
