# Bootstrap The Logical Agent (Windows PowerShell)
Copy-Item .env.example .env -ErrorAction SilentlyContinue
docker compose up -d --build
docker compose exec api alembic upgrade head
docker compose exec api python -m scripts.seed
Write-Host "Open http://localhost:3000 and http://localhost:8000/docs"
