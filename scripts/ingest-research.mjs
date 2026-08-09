#!/usr/bin/env node
/**
 * Research ingest — multi-source papers with topic tags (LLM, AI, World Models, …).
 * Sources: arXiv, OpenAlex, Crossref, Hugging Face Papers, PubMed
 * Writes apps/web/public/data/research-feed.json
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "apps/web/public/data/research-feed.json");
const USER_AGENT =
  "TheLogicalAgentBot/1.0 (+https://github.com/AmmarJamshed/the-logical-agent; research-ingest)";

/** Canonical topics shown in the UI. */
export const RESEARCH_TOPICS = [
  "LLM",
  "AI",
  "World Models",
  "Agents",
  "Multimodal",
  "Computer Vision",
  "NLP",
  "Reinforcement Learning",
  "Robotics",
  "Quantum",
  "Cybersecurity",
  "Machine Learning",
];

const ARXIV_QUERIES = [
  { key: "llm", q: 'all:"large language model" OR all:LLM OR all:"foundation model"', label: "LLM" },
  { key: "world-models", q: 'all:"world model" OR all:"world models"', label: "World Models" },
  { key: "agents", q: 'all:"ai agent" OR all:agentic OR all:"multi-agent" OR all:"tool use"', label: "Agents" },
  { key: "multimodal", q: 'all:multimodal OR all:"vision language" OR all:VLM', label: "Multimodal" },
  { key: "ai", q: "cat:cs.AI", label: "AI" },
  { key: "ml", q: "cat:cs.LG", label: "Machine Learning" },
  { key: "nlp", q: "cat:cs.CL", label: "NLP" },
  { key: "cv", q: "cat:cs.CV", label: "Computer Vision" },
  { key: "rl", q: 'all:"reinforcement learning" OR cat:cs.LG AND all:RL', label: "Reinforcement Learning" },
  { key: "robotics", q: "cat:cs.RO", label: "Robotics" },
  { key: "security", q: "cat:cs.CR", label: "Cybersecurity" },
  { key: "quantum", q: "cat:quant-ph", label: "Quantum" },
];

const OPENALEX_QUERIES = [
  "large language models",
  "world models AI",
  "agentic AI",
  "multimodal foundation models",
];

const CROSSREF_QUERIES = [
  "large language model",
  "world model deep learning",
  "AI agents",
];

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

function idFrom(...parts) {
  return createHash("sha1").update(parts.join("|")).digest("hex").slice(0, 12);
}

function clean(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function detectTopics(text, preferred) {
  const t = String(text || "").toLowerCase();
  const found = new Set(preferred ? [preferred] : []);
  const rules = [
    ["LLM", /\b(llm|large language model|foundation model|gpt|transformer language)\b/],
    ["World Models", /\bworld models?\b/],
    ["Agents", /\b(agentic|ai agents?|multi-?agent|tool[- ]use|tool calling)\b/],
    ["Multimodal", /\b(multimodal|vision[- ]language|vlm|image[- ]text)\b/],
    ["Computer Vision", /\b(computer vision|object detection|image segmentation|cvpr)\b/],
    ["NLP", /\b(nlp|natural language|tokenization|named entity)\b/],
    ["Reinforcement Learning", /\b(reinforcement learning|\brl\b|policy gradient|q-learning)\b/],
    ["Robotics", /\b(robot|humanoid|manipulation|loco-?manipulation)\b/],
    ["Quantum", /\b(quantum|qubit)\b/],
    ["Cybersecurity", /\b(cyber|security|adversarial attack|malware|cryptograph)\b/],
    ["Machine Learning", /\b(machine learning|deep learning|neural network|scikit)\b/],
    ["AI", /\b(artificial intelligence|\bai\b|generative ai)\b/],
  ];
  for (const [name, re] of rules) {
    if (re.test(t)) found.add(name);
  }
  if (!found.size) found.add("AI");
  return [...found];
}

function extractTag(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  return m ? clean(m[1].replace(/<!\[CDATA\[|\]\]>/g, "")) : "";
}

function extractAuthors(block) {
  const names = [];
  const re = /<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/gi;
  let m;
  while ((m = re.exec(block))) names.push(clean(m[1]));
  return names;
}

function extractLink(block) {
  const abs = block.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/i);
  if (abs?.[1]) return abs[1];
  const any = block.match(/<id>(https?:\/\/arxiv\.org\/abs\/[^<]+)<\/id>/i);
  return any?.[1] || "";
}

function extractPdf(block) {
  const m = block.match(/<link[^>]*title="pdf"[^>]*href="([^"]+)"/i);
  return m?.[1] || null;
}

function extractCategory(block) {
  const m = block.match(/<category[^>]*term="([^"]+)"/i);
  return m?.[1] || null;
}

function paperBase(partial) {
  const topics = detectTopics(
    `${partial.title} ${partial.abstract || partial.summary || ""} ${partial.category || ""}`,
    partial.topic,
  );
  return {
    id: partial.id,
    title: partial.title,
    slug: partial.slug || slugify(partial.title),
    abstract: (partial.abstract || "").slice(0, 700),
    summary: (partial.summary || partial.abstract || "").slice(0, 280),
    authors: partial.authors || [],
    author_line:
      partial.author_line ||
      ((partial.authors || []).slice(0, 4).join(", ") + ((partial.authors || []).length > 4 ? " et al." : "")),
    url: partial.url || null,
    pdf_url: partial.pdf_url || null,
    category: partial.category || null,
    published_at: partial.published_at || null,
    source: partial.source,
    venue: partial.venue || partial.source,
    topic: topics[0],
    topics,
    topic_key: slugify(topics[0]),
  };
}

async function fetchArxiv(query, maxResults = 15) {
  const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(query)}&sortBy=submittedDate&sortOrder=descending&max_results=${maxResults}`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/atom+xml" },
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`arXiv ${res.status}`);
  const xml = await res.text();
  return xml
    .split("<entry>")
    .slice(1)
    .map((raw) => {
      const block = raw.split("</entry>")[0] || raw;
      const title = extractTag(block, "title");
      const summary = extractTag(block, "summary");
      const authors = extractAuthors(block);
      const urlAbs = extractLink(block);
      return {
        id: idFrom("arxiv", urlAbs || title),
        title,
        abstract: summary,
        summary,
        authors,
        url: urlAbs,
        pdf_url: extractPdf(block),
        category: extractCategory(block),
        published_at: extractTag(block, "published") || null,
        source: "arXiv",
        venue: "arXiv",
      };
    })
    .filter((p) => p.title);
}

async function fetchOpenAlex(query) {
  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("search", query);
  url.searchParams.set("filter", "from_publication_date:2024-01-01");
  url.searchParams.set("per-page", "12");
  url.searchParams.set("sort", "publication_date:desc");
  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`OpenAlex ${res.status}`);
  const data = await res.json();
  return (data.results || []).map((w) => {
    const authors = (w.authorships || []).map((a) => a.author?.display_name).filter(Boolean);
    const abstract =
      w.abstract_inverted_index
        ? Object.entries(w.abstract_inverted_index)
            .flatMap(([word, idxs]) => idxs.map((i) => [i, word]))
            .sort((a, b) => a[0] - b[0])
            .map(([, word]) => word)
            .join(" ")
        : "";
    return {
      id: idFrom("openalex", w.id || w.doi || w.display_name),
      title: clean(w.display_name),
      abstract: clean(abstract),
      summary: clean(abstract).slice(0, 280),
      authors,
      url: w.primary_location?.landing_page_url || w.doi || w.id,
      pdf_url: w.open_access?.oa_url || null,
      category: w.primary_topic?.display_name || null,
      published_at: w.publication_date ? `${w.publication_date}T00:00:00.000Z` : null,
      source: "OpenAlex",
      venue: w.primary_location?.source?.display_name || "OpenAlex",
    };
  });
}

async function fetchCrossref(query) {
  const url = new URL("https://api.crossref.org/works");
  url.searchParams.set("query", query);
  url.searchParams.set("filter", "from-pub-date:2024-01-01,type:journal-article");
  url.searchParams.set("rows", "10");
  url.searchParams.set("sort", "published");
  url.searchParams.set("order", "desc");
  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`Crossref ${res.status}`);
  const data = await res.json();
  return (data.message?.items || []).map((w) => {
    const title = clean((w.title || [])[0] || "");
    const authors = (w.author || []).map((a) => clean(`${a.given || ""} ${a.family || ""}`)).filter(Boolean);
    const dateParts = w.published?.["date-parts"]?.[0] || w.created?.["date-parts"]?.[0];
    const published_at = dateParts
      ? new Date(Date.UTC(dateParts[0], (dateParts[1] || 1) - 1, dateParts[2] || 1)).toISOString()
      : null;
    return {
      id: idFrom("crossref", w.DOI || title),
      title,
      abstract: clean((w.abstract || "").replace(/<[^>]+>/g, " ")),
      summary: clean((w.abstract || "").replace(/<[^>]+>/g, " ")).slice(0, 280),
      authors,
      url: w.URL || (w.DOI ? `https://doi.org/${w.DOI}` : null),
      pdf_url: null,
      category: (w.subject || [])[0] || null,
      published_at,
      source: "Crossref",
      venue: (w["container-title"] || [])[0] || "Journal",
    };
  });
}

async function fetchHuggingFacePapers() {
  const res = await fetch("https://huggingface.co/api/daily_papers", {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) {
    // fallback list endpoint observed earlier
    const r2 = await fetch("https://huggingface.co/api/papers?limit=30", {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(45000),
    });
    if (!r2.ok) throw new Error(`HF papers ${res.status}/${r2.status}`);
    const list = await r2.json();
    return (Array.isArray(list) ? list : []).map((p) => ({
      id: idFrom("hf", p.id || p.title),
      title: clean(p.title),
      abstract: clean(p.summary || p.abstract || ""),
      summary: clean(p.summary || p.abstract || "").slice(0, 280),
      authors: (p.authors || []).map((a) => (typeof a === "string" ? a : a.name)).filter(Boolean),
      url: p.id ? `https://huggingface.co/papers/${p.id}` : p.url || null,
      pdf_url: p.id ? `https://arxiv.org/pdf/${p.id}.pdf` : null,
      category: null,
      published_at: p.publishedAt || p.published || null,
      source: "Hugging Face",
      venue: "Hugging Face Papers",
    }));
  }
  const data = await res.json();
  return (Array.isArray(data) ? data : []).slice(0, 30).map((row) => {
    const p = row.paper || row;
    return {
      id: idFrom("hf", p.id || p.title),
      title: clean(p.title),
      abstract: clean(p.summary || ""),
      summary: clean(p.summary || "").slice(0, 280),
      authors: (p.authors || []).map((a) => (typeof a === "string" ? a : a.name)).filter(Boolean),
      url: p.id ? `https://huggingface.co/papers/${p.id}` : null,
      pdf_url: p.id ? `https://arxiv.org/pdf/${p.id}.pdf` : null,
      category: null,
      published_at: row.publishedAt || p.publishedAt || null,
      source: "Hugging Face",
      venue: "Hugging Face Papers",
    };
  });
}

async function fetchPubmed() {
  const searchUrl =
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=large+language+model+OR+artificial+intelligence+OR+%22world+model%22&retmax=20&retmode=json&sort=pub+date";
  const sRes = await fetch(searchUrl, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(45000),
  });
  if (!sRes.ok) throw new Error(`PubMed search ${sRes.status}`);
  const sData = await sRes.json();
  const ids = sData.esearchresult?.idlist || [];
  if (!ids.length) return [];
  const sumUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
  const eRes = await fetch(sumUrl, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(45000),
  });
  if (!eRes.ok) throw new Error(`PubMed summary ${eRes.status}`);
  const eData = await eRes.json();
  return ids
    .map((id) => {
      const w = eData.result?.[id];
      if (!w || w.error) return null;
      return {
        id: idFrom("pubmed", id),
        title: clean(w.title),
        abstract: "",
        summary: clean(w.title).slice(0, 280),
        authors: (w.authors || []).map((a) => a.name).filter(Boolean),
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        pdf_url: null,
        category: (w.pubtype || [])[0] || null,
        published_at: w.pubdate ? new Date(w.pubdate).toISOString() : null,
        source: "PubMed",
        venue: w.fulljournalname || w.source || "PubMed",
      };
    })
    .filter(Boolean);
}

function dedupe(papers) {
  const seen = new Set();
  const out = [];
  for (const p of papers) {
    const key = (p.url || p.title).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

async function main() {
  console.log("Ingesting multi-source research…");
  const all = [];
  const sources = {};

  for (const item of ARXIV_QUERIES) {
    try {
      const papers = await fetchArxiv(item.q, 12);
      sources[`arxiv_${item.key}`] = papers.length;
      for (const p of papers) all.push(paperBase({ ...p, topic: item.label }));
      console.log(`  arXiv ${item.key}: ${papers.length}`);
      await new Promise((r) => setTimeout(r, 600));
    } catch (err) {
      console.warn(`  arXiv ${item.key}:`, err.message);
      sources[`arxiv_${item.key}`] = 0;
    }
  }

  for (const q of OPENALEX_QUERIES) {
    try {
      const papers = await fetchOpenAlex(q);
      sources.openalex = (sources.openalex || 0) + papers.length;
      for (const p of papers) all.push(paperBase(p));
      console.log(`  OpenAlex "${q}": ${papers.length}`);
      await new Promise((r) => setTimeout(r, 400));
    } catch (err) {
      console.warn(`  OpenAlex:`, err.message);
    }
  }

  for (const q of CROSSREF_QUERIES) {
    try {
      const papers = await fetchCrossref(q);
      sources.crossref = (sources.crossref || 0) + papers.length;
      for (const p of papers) all.push(paperBase(p));
      console.log(`  Crossref "${q}": ${papers.length}`);
      await new Promise((r) => setTimeout(r, 400));
    } catch (err) {
      console.warn(`  Crossref:`, err.message);
    }
  }

  try {
    const papers = await fetchHuggingFacePapers();
    sources.huggingface = papers.length;
    for (const p of papers) all.push(paperBase(p));
    console.log(`  Hugging Face: ${papers.length}`);
  } catch (err) {
    console.warn("  Hugging Face:", err.message);
    sources.huggingface = 0;
  }

  try {
    const papers = await fetchPubmed();
    sources.pubmed = papers.length;
    for (const p of papers) all.push(paperBase(p));
    console.log(`  PubMed: ${papers.length}`);
  } catch (err) {
    console.warn("  PubMed:", err.message);
    sources.pubmed = 0;
  }

  const papers = dedupe(all).sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));
  const byTopic = {};
  for (const topic of RESEARCH_TOPICS) {
    byTopic[topic] = papers.filter((p) => (p.topics || []).includes(topic)).length;
  }

  const payload = {
    generated_at: new Date().toISOString(),
    total: papers.length,
    sources,
    topics: RESEARCH_TOPICS,
    topic_counts: byTopic,
    papers,
  };

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Wrote ${papers.length} papers → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
