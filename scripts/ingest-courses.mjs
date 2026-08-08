#!/usr/bin/env node
/**
 * Course ingest — popular (high reviews) + newly launched courses from the web.
 * Writes apps/web/public/data/courses-feed.json
 *
 * Sources:
 *   - Coursera public catalog API (slug lookups + recent catalog)
 *   - edX courses API
 *   - Curated highly-rated programs (ratings from public roundups)
 *   - NewsAPI course-launch headlines (optional NEWS_API_KEY)
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "apps/web/public/data/courses-feed.json");
const USER_AGENT =
  "TheLogicalAgentBot/1.0 (+https://github.com/AmmarJamshed/the-logical-agent; course-ingest)";

/** Well-known popular courses with public review signals. */
const POPULAR_SEED = [
  {
    slug: "machine-learning",
    provider: "Coursera / Stanford / DeepLearning.AI",
    name: "Machine Learning (Andrew Ng)",
    url: "https://www.coursera.org/learn/machine-learning",
    rating: 4.9,
    review_count: 250000,
    difficulty: "beginner",
    is_free: true,
    technologies: ["ai", "python", "machine-learning"],
    ai_summary:
      "Flagship ML course with millions of learners; consistently cited among the highest-rated AI programs.",
  },
  {
    slug: "supervised-machine-learning-regression-and-classification",
    provider: "Coursera / Stanford / DeepLearning.AI",
    name: "Supervised Machine Learning: Regression and Classification",
    url: "https://www.coursera.org/learn/machine-learning-course",
    rating: 4.9,
    review_count: 120000,
    difficulty: "beginner",
    is_free: true,
    technologies: ["ai", "python", "scikit-learn"],
    ai_summary: "First course in the modern Machine Learning Specialization; project-based with NumPy and scikit-learn.",
  },
  {
    slug: "generative-ai-with-llms",
    provider: "Coursera / DeepLearning.AI / AWS",
    name: "Generative AI with Large Language Models",
    url: "https://www.coursera.org/learn/generative-ai-with-llms",
    rating: 4.8,
    review_count: 15000,
    difficulty: "intermediate",
    is_free: true,
    technologies: ["ai", "llm", "aws"],
    ai_summary: "Practical LLM lifecycle course covering training, fine-tuning, and deployment patterns.",
  },
  {
    slug: "ai-for-everyone",
    provider: "Coursera / DeepLearning.AI",
    name: "AI For Everyone",
    url: "https://www.coursera.org/learn/ai-for-everyone",
    rating: 4.8,
    review_count: 180000,
    difficulty: "beginner",
    is_free: true,
    technologies: ["ai"],
    ai_summary: "Non-technical overview of AI strategy, workflows, and organizational adoption.",
  },
  {
    slug: null,
    provider: "Coursera / Google",
    name: "Google AI Essentials",
    url: "https://www.coursera.org/learn/google-ai-essentials",
    rating: 4.7,
    review_count: 40000,
    difficulty: "beginner",
    is_free: false,
    technologies: ["ai", "productivity"],
    ai_summary: "Google’s workplace AI fundamentals program — strong learner ratings and high enrollment.",
  },
  {
    slug: null,
    provider: "Coursera / IBM",
    name: "IBM AI Engineering Professional Certificate",
    url: "https://www.coursera.org/professional-certificates/ai-engineer",
    rating: 4.6,
    review_count: 25000,
    difficulty: "intermediate",
    is_free: false,
    technologies: ["ai", "python", "deep-learning"],
    ai_summary: "Career certificate spanning ML, deep learning, and applied AI engineering labs.",
  },
  {
    name: "Practical Deep Learning for Coders",
    provider: "fast.ai",
    slug: "practical-deep-learning",
    url: "https://course.fast.ai/",
    rating: 4.9,
    review_count: 50000,
    difficulty: "intermediate",
    is_free: true,
    technologies: ["ai", "deep-learning", "python"],
    ai_summary: "Free, frequently updated deep learning course with a top-down coding-first approach.",
  },
  {
    name: "Hugging Face NLP Course",
    provider: "Hugging Face",
    slug: "huggingface-nlp-course",
    url: "https://huggingface.co/learn/nlp-course",
    rating: 4.8,
    review_count: 20000,
    difficulty: "intermediate",
    is_free: true,
    technologies: ["ai", "nlp", "transformers"],
    ai_summary: "Free hands-on Transformers / Hub course widely recommended for applied NLP.",
  },
  {
    name: "Hugging Face Agents Course",
    provider: "Hugging Face",
    slug: "huggingface-agents-course",
    url: "https://huggingface.co/learn/agents-course",
    rating: 4.7,
    review_count: 8000,
    difficulty: "intermediate",
    is_free: true,
    technologies: ["ai", "agents", "llm"],
    ai_summary: "Newer free path focused on building and evaluating AI agents with open tooling.",
  },
  {
    name: "CS50's Introduction to Artificial Intelligence with Python",
    provider: "edX / Harvard",
    slug: "cs50-ai",
    url: "https://www.edx.org/learn/artificial-intelligence/harvard-university-cs50-s-introduction-to-artificial-intelligence-with-python",
    rating: 4.8,
    review_count: 30000,
    difficulty: "intermediate",
    is_free: true,
    technologies: ["ai", "python", "search"],
    ai_summary: "Harvard CS50 AI — highly reviewed university course covering search, ML, and NLP.",
  },
  {
    name: "Associate AI Engineer for Developers",
    provider: "DataCamp",
    slug: "associate-ai-engineer-for-developers",
    url: "https://www.datacamp.com/tracks/associate-ai-engineer-for-developers",
    rating: 4.7,
    review_count: 5000,
    difficulty: "intermediate",
    is_free: false,
    technologies: ["ai", "python", "llm"],
    ai_summary: "2026 roundup favorite for developers moving into applied AI engineering.",
  },
  {
    name: "Google Cybersecurity Professional Certificate",
    provider: "Coursera / Google",
    slug: null,
    url: "https://www.coursera.org/professional-certificates/google-cybersecurity",
    rating: 4.8,
    review_count: 70000,
    difficulty: "beginner",
    is_free: false,
    technologies: ["cybersecurity"],
    ai_summary: "High-enrollment Google career certificate with strong learner ratings.",
  },
];

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function idFrom(...parts) {
  return createHash("sha1").update(parts.join("|")).digest("hex").slice(0, 12);
}

function detectTechs(text) {
  const t = String(text || "").toLowerCase();
  const map = [
    ["ai", /\b(ai|artificial intelligence|llm|gpt|generative|agentic|vertex|gemini)\b/],
    ["machine-learning", /\b(machine learning|ml|scikit|supervised)\b/],
    ["deep-learning", /\b(deep learning|neural|pytorch|tensorflow)\b/],
    ["cybersecurity", /\b(cyber|security|ransomware|malware|soc)\b/],
    ["cloud", /\b(cloud|aws|azure|gcp|kubernetes|vertex)\b/],
    ["python", /\bpython\b/],
    ["data", /\b(data science|data analysis|analytics)\b/],
    ["quantum", /\bquantum\b/],
  ];
  return map.filter(([, re]) => re.test(t)).map(([name]) => name);
}

function difficultyFrom(text) {
  const t = String(text || "").toLowerCase();
  if (/advanced|expert/.test(t)) return "advanced";
  if (/intermediate|professional/.test(t)) return "intermediate";
  return "beginner";
}

async function fetchJson(url, headers = {}) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...headers },
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

async function fetchCourseraBySlug(slug) {
  const url = new URL("https://api.coursera.org/api/courses.v1");
  url.searchParams.set("q", "slug");
  url.searchParams.set("slug", slug);
  url.searchParams.set("fields", "name,slug,description,photoUrl,startDate,workload,domainTypes");
  const data = await fetchJson(url.toString());
  return data.elements?.[0] || null;
}

async function fetchCourseraCatalog(limit = 100) {
  const url = new URL("https://api.coursera.org/api/courses.v1");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("start", "0");
  url.searchParams.set("fields", "name,slug,description,photoUrl,startDate,workload,domainTypes");
  const data = await fetchJson(url.toString());
  return data.elements || [];
}

function mapCoursera(el, extras = {}) {
  const text = `${el.name || ""} ${el.description || ""}`;
  const techs = detectTechs(text);
  const start = el.startDate ? new Date(el.startDate).toISOString() : null;
  const daysAgo = start ? (Date.now() - new Date(start).getTime()) / 86400000 : null;
  const category =
    extras.category ||
    (daysAgo !== null && daysAgo <= 180 ? "newly_launched" : "catalog");
  return {
    id: idFrom("coursera", el.id || el.slug),
    name: el.name,
    slug: el.slug || slugify(el.name),
    provider: extras.provider || "Coursera",
    country_code: "US",
    modality: "online",
    difficulty: extras.difficulty || difficultyFrom(text),
    is_free: extras.is_free ?? true,
    technologies: extras.technologies?.length ? extras.technologies : techs.length ? techs : ["ai"],
    ai_summary: extras.ai_summary || String(el.description || "").replace(/\s+/g, " ").slice(0, 280),
    is_promoted: Boolean(extras.is_promoted || extras.category === "popular"),
    category,
    rating: extras.rating ?? null,
    review_count: extras.review_count ?? null,
    url: extras.url || `https://www.coursera.org/learn/${el.slug}`,
    image_url: el.photoUrl || null,
    workload: el.workload || null,
    launched_at: start,
    source: "coursera",
  };
}

async function enrichPopularFromCoursera() {
  const out = [];
  for (const seed of POPULAR_SEED) {
    try {
      if (seed.provider.includes("Coursera") && seed.slug) {
        const el = await fetchCourseraBySlug(seed.slug);
        if (el) {
          out.push(
            mapCoursera(el, {
              ...seed,
              category: "popular",
              is_promoted: true,
              provider: seed.provider,
            }),
          );
          continue;
        }
      }
    } catch (err) {
      console.warn(`Coursera slug ${seed.slug}:`, err.message);
    }
    out.push({
      id: idFrom("seed", seed.slug || seed.name),
      name: seed.name,
      slug: seed.slug || slugify(seed.name),
      provider: seed.provider,
      country_code: "US",
      modality: "online",
      difficulty: seed.difficulty,
      is_free: seed.is_free,
      technologies: seed.technologies,
      ai_summary: seed.ai_summary,
      is_promoted: true,
      category: "popular",
      rating: seed.rating,
      review_count: seed.review_count,
      url: seed.url,
      image_url: null,
      workload: null,
      launched_at: null,
      source: "curated-web",
    });
  }
  return out;
}

async function fetchNewlyLaunchedCoursera() {
  const elements = await fetchCourseraCatalog(200);
  const cutoff = Date.now() - 180 * 86400000;
  const interesting = elements
    .filter((el) => {
      if (!el.startDate) return false;
      if (el.startDate < cutoff) return false;
      const blob = `${el.name} ${el.description}`.toLowerCase();
      return /ai|machine learning|llm|generative|cyber|security|cloud|data|python|quantum|agent/.test(
        blob,
      );
    })
    .sort((a, b) => (b.startDate || 0) - (a.startDate || 0))
    .slice(0, 40)
    .map((el) => mapCoursera(el, { category: "newly_launched", is_promoted: false }));
  return interesting;
}

async function fetchEdxCourses() {
  const queries = ["artificial intelligence", "machine learning", "cybersecurity", "cloud computing"];
  const items = [];
  for (const q of queries) {
    try {
      const url = new URL("https://courses.edx.org/api/courses/v1/courses/");
      url.searchParams.set("page_size", "20");
      url.searchParams.set("search_term", q);
      const data = await fetchJson(url.toString());
      for (const c of data.results || []) {
        const start = c.start || c.enrollment_start || null;
        if (!start) continue;
        const days = (Date.now() - new Date(start).getTime()) / 86400000;
        // Recent-ish edX offerings (platforms often keep rolling start dates)
        if (days < -30 || days > 900) continue;
        const name = c.name || c.course_id;
        if (/ccx-v1:|demo|test course/i.test(String(c.course_id || name))) continue;
        const desc = c.short_description || c.overview || "";
        const techs = detectTechs(`${name} ${desc} ${q}`);
        items.push({
          id: idFrom("edx", c.course_id || c.id || name),
          name,
          slug: slugify(name),
          provider: `edX / ${c.org || "University"}`,
          country_code: null,
          modality: "online",
          difficulty: difficultyFrom(desc),
          is_free: true,
          technologies: techs.length ? techs : detectTechs(q),
          ai_summary: String(desc).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 280),
          is_promoted: false,
          category: "newly_launched",
          rating: null,
          review_count: null,
          url: c.course_about_url || `https://www.edx.org/course/${slugify(name)}`,
          image_url: c.media?.image?.raw || c.media?.course_image?.uri_absolute || null,
          workload: c.effort || null,
          launched_at: start,
          source: "edx",
        });
      }
    } catch (err) {
      console.warn(`edX ${q}:`, err.message);
    }
  }
  return items;
}

function looksLikeCourseLaunch(title, description, url) {
  const blob = `${title} ${description} ${url}`.toLowerCase();
  if (/pypi\.org|kernel\.org|gitlab\.freedesktop|hackaday|npmjs|crates\.io|docker hub/.test(blob)) {
    return false;
  }
  if (/\b(0\.\d+\.\d+|merge tag|drm-fixes|mcp\b|released version)\b/.test(blob) && !/course|certificat|bootcamp|mooc/.test(blob)) {
    return false;
  }
  // Exclude marketing / how-to-sell-courses / affiliate deal spam
  if (/\b(sell online courses|course creators|\$\d+\.\d+ online course|how to actually sell)\b/.test(blob)) {
    return false;
  }
  return (
    /\b(launches? (a |an |its |new )?course|new course|course launch|professional certificate|nanodegree|bootcamp|mooc|specialization)\b/.test(
      blob,
    ) || /\b(coursera|edx|udacity|udemy|datacamp|deeplearning\.ai)\b/.test(blob) && /\b(course|certificate|specialization)\b/.test(blob)
  );
}

async function fetchNewsLaunches() {
  const key = process.env.NEWS_API_KEY;
  if (!key) return [];
  const queries = [
    '("new course" OR "launches course" OR "course launch" OR "professional certificate") AND (AI OR "machine learning" OR cybersecurity OR Coursera OR edX OR Udacity OR Google)',
  ];
  const items = [];
  for (const q of queries) {
    try {
      const url = new URL("https://newsapi.org/v2/everything");
      url.searchParams.set("q", q);
      url.searchParams.set("language", "en");
      url.searchParams.set("sortBy", "publishedAt");
      url.searchParams.set("pageSize", "25");
      const data = await fetchJson(url.toString(), { "X-Api-Key": key });
      for (const a of data.articles || []) {
        if (!a.title || a.title === "[Removed]") continue;
        if (!looksLikeCourseLaunch(a.title, a.description || "", a.url || "")) continue;
        items.push({
          id: idFrom("news", a.url || a.title),
          name: a.title.replace(/\s+/g, " ").slice(0, 160),
          slug: slugify(a.title),
          provider: a.source?.name || "News",
          country_code: null,
          modality: "online",
          difficulty: "beginner",
          is_free: /free/i.test(`${a.title} ${a.description || ""}`),
          technologies: detectTechs(`${a.title} ${a.description || ""}`),
          ai_summary: (a.description || a.content || "").replace(/\s+/g, " ").slice(0, 280),
          is_promoted: false,
          category: "newly_launched",
          rating: null,
          review_count: null,
          url: a.url,
          image_url: a.urlToImage || null,
          workload: null,
          launched_at: a.publishedAt || null,
          source: "newsapi",
        });
      }
    } catch (err) {
      console.warn("NewsAPI courses:", err.message);
    }
  }
  return items;
}

function dedupe(courses) {
  const seen = new Set();
  const out = [];
  for (const c of courses) {
    const key = `${(c.name || "").toLowerCase().slice(0, 80)}|${(c.provider || "").toLowerCase().slice(0, 40)}`;
    const urlKey = (c.url || "").toLowerCase();
    if (seen.has(key) || (urlKey && seen.has(urlKey))) continue;
    seen.add(key);
    if (urlKey) seen.add(urlKey);
    out.push(c);
  }
  return out;
}

async function main() {
  console.log("Ingesting courses (popular + newly launched)...");
  const [popular, courseraNew, edx, news] = await Promise.all([
    enrichPopularFromCoursera(),
    fetchNewlyLaunchedCoursera().catch((e) => {
      console.warn("Coursera new:", e.message);
      return [];
    }),
    fetchEdxCourses().catch((e) => {
      console.warn("edX:", e.message);
      return [];
    }),
    fetchNewsLaunches(),
  ]);

  const courses = dedupe([...popular, ...courseraNew, ...edx, ...news]);
  const popularList = courses
    .filter((c) => c.category === "popular")
    .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.review_count || 0) - (a.review_count || 0));
  const newlyList = courses
    .filter((c) => c.category === "newly_launched")
    .sort((a, b) => new Date(b.launched_at || 0) - new Date(a.launched_at || 0));
  const other = courses.filter((c) => c.category !== "popular" && c.category !== "newly_launched");

  const payload = {
    generated_at: new Date().toISOString(),
    total: courses.length,
    sources: {
      curated_popular: popular.length,
      coursera_new: courseraNew.length,
      edx: edx.length,
      newsapi: news.length,
    },
    popular: popularList,
    newly_launched: newlyList,
    courses: [...popularList, ...newlyList, ...other],
  };

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(payload, null, 2), "utf8");
  console.log(
    `Wrote ${courses.length} courses → ${OUT} (popular=${popularList.length}, new=${newlyList.length})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
