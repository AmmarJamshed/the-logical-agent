/** Shared demo content + Groq helpers for public Vercel deployment. */

export type DemoArticle = {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  summary?: string | null;
  hero_image_url?: string | null;
  reading_time_minutes: number;
  technologies: string[];
  published_at?: string | null;
  ai_confidence_score?: number | null;
  is_sponsored: boolean;
  view_count: number;
  body?: string;
  source?: string;
  source_name?: string;
  url?: string;
};

export type DemoCourse = {
  id: string;
  name: string;
  slug: string;
  provider: string;
  country_code?: string | null;
  modality: string;
  difficulty: string;
  is_free: boolean;
  technologies: string[];
  ai_summary?: string | null;
  is_promoted: boolean;
  category?: "popular" | "newly_launched" | "catalog" | string;
  rating?: number | null;
  review_count?: number | null;
  url?: string | null;
  image_url?: string | null;
  workload?: string | null;
  launched_at?: string | null;
  source?: string | null;
};

export const DEMO_ARTICLES: DemoArticle[] = [
  {
    id: "1",
    title: "Agentic AI Moves From Demo to Production Infrastructure",
    slug: "agentic-ai-production-infrastructure",
    subtitle: "Enterprises are wiring autonomous agents into mission-critical workflows.",
    summary:
      "A new wave of production deployments signals the maturation of agentic AI stacks — with evaluation, observability, and orchestration as first-class concerns.",
    reading_time_minutes: 4,
    technologies: ["ai", "agents", "llm"],
    published_at: new Date().toISOString(),
    ai_confidence_score: 0.91,
    is_sponsored: false,
    view_count: 2401,
    hero_image_url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1600",
    body: "Enterprises are shifting from prototypes to governed multi-agent systems. Reliability, evaluation, and orchestration are now procurement requirements.",
  },
  {
    id: "2",
    title: "Quantum Computing Startups Race Toward Error-Corrected Milestones",
    slug: "quantum-error-corrected-milestones",
    summary: "Hardware and software teams converge on practical fault-tolerance roadmaps for the next 24 months.",
    reading_time_minutes: 5,
    technologies: ["quantum", "semiconductors"],
    published_at: new Date(Date.now() - 86400000).toISOString(),
    ai_confidence_score: 0.87,
    is_sponsored: false,
    view_count: 1288,
    hero_image_url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1600",
  },
  {
    id: "3",
    title: "Cybersecurity Certifications Surge Across Europe",
    slug: "cybersecurity-certifications-europe",
    summary: "Governments and universities expand free and hybrid programs as AI systems become attack surfaces.",
    reading_time_minutes: 3,
    technologies: ["cybersecurity", "ai"],
    published_at: new Date(Date.now() - 172800000).toISOString(),
    ai_confidence_score: 0.9,
    is_sponsored: false,
    view_count: 976,
    hero_image_url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1600",
  },
];

export const DEMO_COURSES: DemoCourse[] = [
  {
    id: "c1",
    name: "Applied Agentic AI Engineering",
    slug: "applied-agentic-ai-engineering",
    provider: "Logical Academy",
    country_code: "DE",
    modality: "online",
    difficulty: "advanced",
    is_free: false,
    technologies: ["ai", "python", "langgraph"],
    ai_summary: "Hands-on program for building production multi-agent systems.",
    is_promoted: true,
  },
  {
    id: "c2",
    name: "Cybersecurity Fundamentals for AI Systems",
    slug: "cybersecurity-fundamentals-ai",
    provider: "TU Munich Extension",
    country_code: "DE",
    modality: "hybrid",
    difficulty: "intermediate",
    is_free: true,
    technologies: ["cybersecurity", "ai"],
    ai_summary: "Free certification-oriented course on securing AI systems.",
    is_promoted: false,
  },
  {
    id: "c3",
    name: "Quantum Computing for Software Engineers",
    slug: "quantum-for-software-engineers",
    provider: "Open Quantum Institute",
    country_code: "US",
    modality: "online",
    difficulty: "beginner",
    is_free: true,
    technologies: ["quantum", "python"],
    ai_summary: "Introductory path from classical algorithms to quantum circuits.",
    is_promoted: true,
  },
];

export async function groqChat(prompt: string, system?: string): Promise<{
  content: string;
  model: string;
  provider: string;
}> {
  const apiKey = process.env.GROQ_API_KEY;
  const models = (
    process.env.GROQ_MODELS ||
    "llama-3.3-70b-versatile,llama-3.1-8b-instant,gemma2-9b-it"
  )
    .split(/[,\n\r]+/)
    .map((m) => m.trim())
    .filter(Boolean);

  if (!apiKey) {
    return {
      content: `[demo] ${prompt.slice(0, 280)}`,
      model: "offline",
      provider: "offline",
    };
  }

  const messages = [
    ...(system ? [{ role: "system" as const, content: system }] : []),
    { role: "user" as const, content: prompt },
  ];

  let lastError = "unknown";
  for (const model of models.map((m) => m.trim()).filter(Boolean)) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages, temperature: 0.3 }),
      });
      if (response.status === 429 || response.status === 503) {
        lastError = `rate_limited:${model}`;
        continue;
      }
      if (!response.ok) {
        lastError = await response.text();
        continue;
      }
      const data = await response.json();
      return {
        content: data.choices?.[0]?.message?.content || "",
        model,
        provider: "groq",
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }
  return {
    content: `[demo-fallback] ${lastError}`,
    model: "offline",
    provider: "offline",
  };
}

export async function hfSentiment(text: string): Promise<{
  label: string;
  score: number;
  provider: string;
  model: string;
}> {
  const token = process.env.HUGGINGFACE_API_KEY;
  const models = (
    process.env.HF_SENTIMENT_MODELS ||
    "cardiffnlp/twitter-roberta-base-sentiment-latest,distilbert/distilbert-base-uncased-finetuned-sst-2-english"
  )
    .split(/[,\n\r]+/)
    .map((m) => m.trim())
    .filter(Boolean);

  if (token) {
    for (const model of models.map((m) => m.trim()).filter(Boolean)) {
      try {
        const response = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: text.slice(0, 2000) }),
        });
        if (response.status === 429 || response.status === 503) continue;
        if (!response.ok) continue;
        const data = await response.json();
        const rows = Array.isArray(data?.[0]) ? data[0] : data;
        if (Array.isArray(rows) && rows[0]?.label) {
          const best = rows.reduce((a: { score: number }, b: { score: number }) =>
            (b.score || 0) > (a.score || 0) ? b : a,
          );
          return {
            label: String(best.label).toLowerCase(),
            score: Number(best.score || 0),
            provider: "huggingface",
            model,
          };
        }
      } catch {
        continue;
      }
    }
  }

  const groq = await groqChat(
    text.slice(0, 3000),
    'Classify sentiment. Reply JSON only: {"label":"positive|neutral|negative","score":0.0-1.0}',
  );
  try {
    const match = groq.content.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : { label: "neutral", score: 0.5 };
    return {
      label: String(parsed.label || "neutral").toLowerCase(),
      score: Number(parsed.score || 0.5),
      provider: groq.provider,
      model: groq.model,
    };
  } catch {
    return { label: "neutral", score: 0.5, provider: groq.provider, model: groq.model };
  }
}
