from pathlib import Path
from dotenv import dotenv_values

root = Path(r"D:\Projects\the-logical-agent")
vals = dotenv_values(root / ".env")
web = root / "apps" / "web"
(web / ".env.production.local").write_text(
    "\n".join(
        [
            f"GROQ_API_KEY={vals.get('GROQ_API_KEY', '')}",
            f"HUGGINGFACE_API_KEY={vals.get('HUGGINGFACE_API_KEY', '')}",
            "GROQ_MODELS=llama-3.3-70b-versatile,llama-3.1-8b-instant,gemma2-9b-it",
            "HF_SENTIMENT_MODELS=cardiffnlp/twitter-roberta-base-sentiment-latest,distilbert/distilbert-base-uncased-finetuned-sst-2-english",
            "NEXT_PUBLIC_API_URL=",
        ]
    )
    + "\n",
    encoding="utf-8",
)
print("wrote apps/web/.env.production.local")
