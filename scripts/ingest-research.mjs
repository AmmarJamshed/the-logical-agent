#!/usr/bin/env node
/**
 * Research ingest — arXiv papers across AI / security / quantum / systems.
 * Writes apps/web/public/data/research-feed.json
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "apps/web/public/data/research-feed.json");
const USER_AGENT = "TheLogicalAgentBot/1.0 (+https://github.com/AmmarJamshed/the-logical-agent; research-ingest)";

const QUERIES = [
  { key: "ai", q: "cat:cs.AI", label: "Artificial Intelligence" },
  { key: "ml", q: "cat:cs.LG", label: "Machine Learning" },
  { key: "cl", q: "cat:cs.CL", label: "Computation and Language" },
  { key: "cv", q: "cat:cs.CV", label: "Computer Vision" },
  { key: "cr", q: "cat:cs.CR", label: "Cryptography & Security" },
  { key: "quantum", q: "cat:quant-ph", label: "Quantum Physics" },
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

async function fetchArxiv(query, maxResults = 20) {
  const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(query)}&sortBy=submittedDate&sortOrder=descending&max_results=${maxResults}`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/atom+xml" },
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`arXiv ${res.status}`);
  const xml = await res.text();
  const entries = xml.split("<entry>").slice(1);
  return entries.map((raw) => {
    const block = raw.split("</entry>")[0] || raw;
    const title = extractTag(block, "title");
    const summary = extractTag(block, "summary");
    const published = extractTag(block, "published");
    const updated = extractTag(block, "updated");
    const authors = extractAuthors(block);
    const urlAbs = extractLink(block);
    const pdf = extractPdf(block);
    const category = extractCategory(block);
    return {
      id: idFrom("arxiv", urlAbs || title),
      title,
      slug: slugify(title),
      abstract: summary.slice(0, 600),
      summary: summary.slice(0, 280),
      authors,
      author_line: authors.slice(0, 4).join(", ") + (authors.length > 4 ? " et al." : ""),
      url: urlAbs,
      pdf_url: pdf,
      category,
      published_at: published || null,
      updated_at: updated || null,
      source: "arxiv",
      venue: "arXiv",
    };
  }).filter((p) => p.title);
}

async function main() {
  console.log("Ingesting research papers from arXiv…");
  const all = [];
  const sources = {};
  for (const item of QUERIES) {
    try {
      const papers = await fetchArxiv(item.q, 18);
      sources[item.key] = papers.length;
      for (const p of papers) {
        all.push({ ...p, topic: item.label, topic_key: item.key });
      }
      console.log(`  ${item.key}: ${papers.length}`);
      await new Promise((r) => setTimeout(r, 800));
    } catch (err) {
      console.warn(`  ${item.key} failed:`, err.message);
      sources[item.key] = 0;
    }
  }

  const seen = new Set();
  const papers = [];
  for (const p of all) {
    const key = (p.url || p.title).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    papers.push(p);
  }
  papers.sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));

  const payload = {
    generated_at: new Date().toISOString(),
    total: papers.length,
    sources,
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
