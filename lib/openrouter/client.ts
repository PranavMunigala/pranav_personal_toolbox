// OpenRouter chat completions — pure text-in/JSON-out. Search/fetch is done separately
// via lib/tinyfish/client.ts and handed to the model as context, so no tool-calling
// dependency here (avoids betting on whether custom presets support tools reliably).
const CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

export const MODEL_LIGHT = "@preset/pranav"; // DeepSeek v4 Flash — filtering, classification, verification
export const MODEL_HEAVY = "@preset/pranav-high"; // Kimi K3 — relevance ranking, reasoning, writing

interface OpenRouterResponse {
  choices?: { message?: { content?: string }; finish_reason?: string }[];
}

export async function callOpenRouter(params: {
  model: string;
  content: string;
  responseSchema: { name: string; schema: object };
}): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY is not set. Add it to .env.local to run this.");
  }

  const res = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      messages: [{ role: "user", content: params.content }],
      response_format: {
        type: "json_schema",
        json_schema: { name: params.responseSchema.name, schema: params.responseSchema.schema, strict: true },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter request failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as OpenRouterResponse;
  const choice = data.choices?.[0];
  if (choice?.finish_reason === "content_filter") {
    throw new Error("The model declined this request.");
  }
  const content = choice?.message?.content;
  if (!content) {
    throw new Error("No content returned from OpenRouter.");
  }
  return content;
}
