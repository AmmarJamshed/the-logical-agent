#!/usr/bin/env bash
set -euo pipefail
cp -n .env.example .env || true
docker compose up -d --build
docker compose exec api alembic upgrade head
docker compose exec api python -m scripts.seed
echo "Open http://localhost:3000 and http://localhost:8000/docs"
