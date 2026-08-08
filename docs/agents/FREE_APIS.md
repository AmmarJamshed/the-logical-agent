# Free APIs used by The Logical Agent

Agents default to **free-first** providers. Set `DEFAULT_LLM_PROVIDER=auto`.

## Model pool + auto-switch

The Logical Agent keeps a **model pool** (`app/agents/llm/pool.py`) that:

1. Fetches live Groq models from `GET /openai/v1/models`
2. Probes curated Hugging Face text + sentiment models
3. On HTTP **429 / 503**, cools that model down and switches to the next
4. Escalates cooldown on repeated failures

### Tasks

| Task | Preferred models |
|------|------------------|
| `text_generation` | Groq Llama / Gemma / Mixtral → HF instruct models |
| `sentiment` | HF RoBERTa / DistilBERT / BERTweet → Groq LLM JSON fallback |

### APIs

- `GET /api/v1/ai/models`
- `POST /api/v1/ai/generate`
- `POST /api/v1/ai/sentiment`
- `POST /api/v1/ai/models/reset-cooldowns`

| Provider | Cost | Get key | Env vars |
|----------|------|---------|----------|
| **Groq** | Free tier | https://console.groq.com/keys | `GROQ_API_KEY` |
| **Google Gemini** | Free tier | https://aistudio.google.com/apikey | `GOOGLE_API_KEY` |
| **OpenRouter** | Free models (`:free`) | https://openrouter.ai/keys | `OPENROUTER_API_KEY` |
| **Ollama** | Free local | https://ollama.com | `OLLAMA_ENABLED=true` |
| **Hugging Face** | Free tier | https://huggingface.co/settings/tokens | `HUGGINGFACE_API_KEY` |

Auto-selection order: Groq → Gemini → OpenRouter → Ollama → Hugging Face → OpenAI/Anthropic (paid).

### Quick start (recommended)

1. Create a free Groq key  
2. Put it in `.env`:

```env
DEFAULT_LLM_PROVIDER=auto
GROQ_API_KEY=gsk_...
```

Or run fully local:

```bash
ollama pull llama3.2
# OLLAMA_ENABLED=true (default)
```

## Free data / discovery APIs (no paid news wire)

| Source | Purpose | Key required? |
|--------|---------|---------------|
| **Hacker News** | Top tech stories | No |
| **arXiv** | Research papers | No |
| **Semantic Scholar** | Paper search | No (rate-limited) |
| **RSS / Atom feeds** | News desks | No |
| **GitHub Search** | Open-source discovery | Optional (higher limits) |

Implemented in `apps/api/app/services/free_sources.py`.

## Not free (optional later)

- OpenAI / Anthropic (paid LLM)
- Stripe / PayPal (payments)
- Twitter / LinkedIn / Facebook publishing APIs (platform accounts)
- Commercial news APIs (NewsAPI paid plans, etc.)
