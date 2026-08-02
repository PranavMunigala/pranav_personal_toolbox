import { fetchUrls } from "@/lib/tinyfish/client";
import { callOpenRouter, MODEL_LIGHT } from "@/lib/openrouter/client";

export interface VerifiableCandidate {
  link: string;
  company: string;
  role: string;
}

export type VerificationStatus = "confirmed_open" | "confirmed_closed" | "unconfirmed";

const VERIFICATION_SCHEMA = {
  name: "posting_verification",
  schema: {
    type: "object",
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            link: { type: "string" },
            status: { type: "string", enum: ["confirmed_open", "confirmed_closed", "unconfirmed"] },
          },
          required: ["link", "status"],
          additionalProperties: false,
        },
      },
    },
    required: ["results"],
    additionalProperties: false,
  },
} as const;

interface RawVerification {
  link: string;
  status: VerificationStatus;
}

/**
 * Fetches each candidate's actual posting URL (via TinyFish, which renders a real
 * browser so JS-heavy boards like LinkedIn/Handshake work too) and asks the model to
 * classify whether it's still a live, open posting based on the real fetched content —
 * never guesses: a URL TinyFish couldn't fetch, or content the model can't read either
 * way, comes back "unconfirmed" rather than assumed open.
 */
export async function verifyPostings(
  candidates: VerifiableCandidate[]
): Promise<Map<string, VerificationStatus>> {
  const map = new Map<string, VerificationStatus>();
  if (candidates.length === 0) return map;

  const fetched = await fetchUrls(candidates.map((c) => c.link));
  const fetchedByUrl = new Map(fetched.map((f) => [f.url, f]));

  const fetchable = candidates.filter((c) => fetchedByUrl.has(c.link));
  for (const c of candidates) {
    if (!fetchedByUrl.has(c.link)) map.set(c.link, "unconfirmed");
  }
  if (fetchable.length === 0) return map;

  const listing = fetchable
    .map((c) => {
      const f = fetchedByUrl.get(c.link)!;
      const excerpt = f.text.slice(0, 3000);
      return `## ${c.company} — ${c.role}\nlink: ${c.link}\nfetched title: ${f.title ?? "(none)"}\ncontent:\n${excerpt}`;
    })
    .join("\n\n---\n\n");

  const prompt = `For each posting below, its actual page content (fetched just now) is included. Determine whether it's still a live, open posting accepting applications.

${listing}

Negative signals (classify "confirmed_closed"): the content says "closed," "no longer accepting applications," "position filled"; a 404/error page; a generic careers/search homepage instead of the specific posting.
Positive signal (classify "confirmed_open"): the specific posting's content is present with a working "Apply" flow described.
If the content is a login wall, an empty/JS shell with no real posting content, or you genuinely can't tell either way, classify "unconfirmed" — never guess "confirmed_open" without real evidence in the content.

Return one result per link, using the exact link string given above.`;

  try {
    const content = await callOpenRouter({
      model: MODEL_LIGHT,
      content: prompt,
      responseSchema: VERIFICATION_SCHEMA,
    });
    const parsed: { results: RawVerification[] } = JSON.parse(content);
    for (const r of parsed.results) {
      map.set(r.link, r.status);
    }
  } catch {
    // Best-effort — anything not classified stays out of the map, and callers treat a
    // missing entry the same as "unconfirmed" (never assumed open).
  }

  return map;
}
