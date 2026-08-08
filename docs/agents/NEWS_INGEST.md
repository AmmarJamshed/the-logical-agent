# NewsAPI + social intelligence ingest

## Secrets

Add these repository secrets (GitHub → Settings → Secrets → Actions):

| Secret | Purpose |
|--------|---------|
| `NEWS_API_KEY` | NewsAPI.org key for all news fetches |
| `GROQ_API_KEY` | Optional AI summaries for short items |

## Schedule

`.github/workflows/intelligence-ingest.yml` runs:

- **Every 2 days** at 06:00 UTC (`0 6 */2 * *`)
- Or manually via **Actions → Intelligence Ingest → Run workflow**

## What it scrapes

1. **NewsAPI** — topic queries + technology top headlines  
2. **Hacker News** — top stories  
3. **Reddit** — r/MachineLearning, r/artificial, r/cybersecurity, r/programming, r/startups  
4. **DEV.to** — top articles  
5. **RSS** — MIT Tech Review, Ars, Krebs, BleepingComputer, GitHub Blog, etc.  
6. **GitHub** — recently updated AI/LLM repos  

Output: `apps/web/public/data/intelligence-feed.json` (committed back to the repo so Vercel serves fresh content).

## Local run

```bash
export NEWS_API_KEY=your_key
export GROQ_API_KEY=optional
node scripts/ingest-intelligence.mjs
```
