# API Documentation

Interactive OpenAPI is the source of truth:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Authentication

1. `POST /api/v1/auth/register`
2. `POST /api/v1/auth/login` → `{ access_token, refresh_token }`
3. Send `Authorization: Bearer <access_token>`

## Example: semantic search

```bash
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query":"Show cybersecurity certifications in Germany.","limit":10}'
```

## Example: publish pipeline

```bash
curl -X POST http://localhost:8000/api/v1/articles/{id}/publish-pipeline \
  -H "Authorization: Bearer $TOKEN"
```

## Pagination

List endpoints return:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "page_size": 20,
  "pages": 1
}
```
