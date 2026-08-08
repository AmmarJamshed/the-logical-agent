.PHONY: help up down build logs migrate seed test lint format api-shell web-shell docs

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

up: ## Start all core services
	docker compose up -d postgres redis elasticsearch minio minio-init mailhog
	docker compose up -d api worker beat web

down: ## Stop all services
	docker compose down

build: ## Rebuild images
	docker compose build

logs: ## Tail API + worker logs
	docker compose logs -f api worker beat web

migrate: ## Run Alembic migrations
	docker compose exec api alembic upgrade head

migrate-new: ## Create new migration (msg=description)
	docker compose exec api alembic revision --autogenerate -m "$(msg)"

seed: ## Seed database with demo data
	docker compose exec api python -m scripts.seed

test: ## Run backend + frontend tests
	docker compose exec api pytest -q
	cd apps/web && npm test -- --passWithNoTests

lint: ## Lint backend and frontend
	cd apps/api && ruff check app tests
	cd apps/web && npm run lint

format: ## Format code
	cd apps/api && ruff format app tests && ruff check --fix app tests
	cd apps/web && npm run format

api-shell: ## Open API container shell
	docker compose exec api bash

web-shell: ## Open web container shell
	docker compose exec web sh

docs: ## Serve OpenAPI docs reminder
	@echo "API docs: http://localhost:8000/docs"
	@echo "ReDoc:    http://localhost:8000/redoc"
	@echo "Mailhog:  http://localhost:8025"
	@echo "MinIO:    http://localhost:9001"

prod-up: ## Start production stack
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

observability: ## Start Prometheus + Grafana
	docker compose --profile observability up -d prometheus grafana
