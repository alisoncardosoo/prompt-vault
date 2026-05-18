export type AIProvider = "openai" | "anthropic";

export type AnalyzedPrompt = {
  title: string;
  content: string;
  description: string;
  tags: string[];
  tool: string;
  notes: string;
};

const VALID_TOOLS = ["ChatGPT", "Claude", "Gemini", "Cursor", "Midjourney", "Outro"];

const SYSTEM_PROMPT = `You are an expert prompt engineer. The user will provide one or more screenshots of AI tool conversations or prompt interfaces.

Your task:
1. Extract the exact prompt text visible in the image(s), reconstructing it faithfully.
2. Improve the prompt for clarity, specificity, and effectiveness without changing its intent. Preserve {{variable}} placeholders if present.
3. Identify which AI tool is being used: ChatGPT, Claude, Gemini, Cursor, Midjourney, or Outro.
4. Return ONLY a valid JSON object — no markdown fences, no explanation, no extra text.

JSON schema (all fields required):
{
  "title": "short descriptive title (max 60 chars)",
  "content": "the improved prompt text",
  "description": "one-sentence summary of what this prompt does",
  "tags": ["tag1", "tag2"],
  "tool": "ChatGPT|Claude|Gemini|Cursor|Midjourney|Outro",
  "notes": "brief observation about what makes this prompt effective"
}

Rules for tags: 2–5 tags, all lowercase, no spaces (use hyphens), relevant to the prompt's purpose.`;

function parseResult(raw: string): AnalyzedPrompt {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("PARSE_ERROR");
  }

  const title = String(parsed.title ?? "").slice(0, 60) || "Prompt importado";
  const content = String(parsed.content ?? "");
  const description = String(parsed.description ?? "");
  const rawTool = String(parsed.tool ?? "");
  const tool = VALID_TOOLS.includes(rawTool) ? rawTool : "Outro";
  const notes = String(parsed.notes ?? "");
  const tags = Array.isArray(parsed.tags)
    ? (parsed.tags as unknown[])
        .map((t) => String(t).toLowerCase().replace(/\s+/g, "-"))
        .slice(0, 5)
    : [];

  return { title, content, description, tags, tool, notes };
}

async function callOpenAI(images: string[], apiKey: string): Promise<AnalyzedPrompt> {
  const imageContent = images.map((b64) => ({
    type: "image_url",
    image_url: { url: b64, detail: "high" },
  }));

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      max_tokens: 1024,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: imageContent },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `API_ERROR: ${(err as { error?: { message?: string } }).error?.message ?? res.statusText}`,
    );
  }

  const data = await res.json();
  return parseResult(data.choices?.[0]?.message?.content ?? "");
}

async function callAnthropic(images: string[], apiKey: string): Promise<AnalyzedPrompt> {
  const imageBlocks = images.map((b64) => {
    const match = b64.match(/^data:([^;]+);base64,(.+)$/);
    const mediaType = (match?.[1] ?? "image/png") as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";
    const data = match?.[2] ?? b64;
    return {
      type: "image",
      source: { type: "base64", media_type: mediaType, data },
    };
  });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-allow-browser": "true",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            { type: "text", text: "Analyze these screenshots and return the JSON." },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `API_ERROR: ${(err as { error?: { message?: string } }).error?.message ?? res.statusText}`,
    );
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";
  return parseResult(text);
}

export async function analyzeImages(
  images: string[],
  provider: AIProvider,
  apiKey: string,
): Promise<AnalyzedPrompt> {
  if (!apiKey) throw new Error("NO_API_KEY");
  if (provider === "openai") return callOpenAI(images, apiKey);
  return callAnthropic(images, apiKey);
}
