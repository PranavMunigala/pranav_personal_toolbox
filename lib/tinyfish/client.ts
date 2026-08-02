// TinyFish search/fetch — free, no credits used per their docs. Fetch renders pages in
// a real Chromium browser, so it works on JS-heavy job boards (LinkedIn/Handshake) that
// a plain HTTP fetch can't read.
const SEARCH_URL = "https://api.search.tinyfish.ai";
const FETCH_URL = "https://api.fetch.tinyfish.ai";
const FETCH_CHUNK_SIZE = 10; // TinyFish's documented max URLs per fetch request

export interface TinyFishSearchResult {
  position: number;
  site_name: string;
  title: string;
  snippet: string;
  url: string;
}

export interface TinyFishFetchResult {
  url: string;
  final_url?: string;
  title?: string;
  text: string;
}

function requireApiKey(): string {
  const key = process.env.TINYFISH_API_KEY;
  if (!key) {
    throw new Error("TINYFISH_API_KEY is not set. Add it to .env.local to run web search.");
  }
  return key;
}

export async function searchWeb(
  query: string,
  opts?: { recency_minutes?: number; domain_type?: "web" | "news" | "research_paper" }
): Promise<TinyFishSearchResult[]> {
  const key = requireApiKey();
  const params = new URLSearchParams({ query });
  if (opts?.recency_minutes) params.set("recency_minutes", String(opts.recency_minutes));
  if (opts?.domain_type) params.set("domain_type", opts.domain_type);

  const res = await fetch(`${SEARCH_URL}?${params.toString()}`, {
    headers: { "X-API-Key": key },
  });
  if (!res.ok) {
    throw new Error(`TinyFish search failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { results?: TinyFishSearchResult[] };
  return data.results ?? [];
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

/** Fetches up to FETCH_CHUNK_SIZE URLs per request, chunking as needed. Best-effort per
 * chunk — a failed chunk is skipped rather than failing the whole batch. */
export async function fetchUrls(urls: string[]): Promise<TinyFishFetchResult[]> {
  if (urls.length === 0) return [];
  const key = requireApiKey();
  const results: TinyFishFetchResult[] = [];

  for (const batch of chunk(urls, FETCH_CHUNK_SIZE)) {
    const res = await fetch(FETCH_URL, {
      method: "POST",
      headers: { "X-API-Key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ urls: batch, format: "markdown" }),
    });
    if (!res.ok) continue;
    const data = (await res.json()) as { results?: TinyFishFetchResult[] };
    results.push(...(data.results ?? []));
  }
  return results;
}
