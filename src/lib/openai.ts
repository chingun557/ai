/**
 * Server-only OpenAI image helper.
 *
 * The API key lives in OPENAI_API_KEY and must never reach the browser, so this
 * module is only imported from route handlers (`src/app/api/**`).
 */

const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
const IMAGE_SIZE = process.env.OPENAI_IMAGE_SIZE ?? "1024x1024";
// gpt-image-1 quality: "low" | "medium" | "high" | "auto". Medium balances
// cost and quality for a demo; override via OPENAI_IMAGE_QUALITY.
const IMAGE_QUALITY = process.env.OPENAI_IMAGE_QUALITY ?? "medium";
const OPENAI_BASE = "https://api.openai.com/v1";

function getApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to .env.local and restart the dev server."
    );
  }
  return apiKey;
}

/** Turn an OpenAI error response into a readable, actionable message. */
async function readError(res: Response): Promise<string> {
  let detail = "";
  try {
    const body = await res.json();
    detail =
      typeof body?.error?.message === "string"
        ? body.error.message
        : JSON.stringify(body?.error ?? body);
  } catch {
    detail = await res.text().catch(() => "");
  }
  if (res.status === 401) {
    return `OpenAI rejected the API key (401). ${detail}`.trim();
  }
  if (res.status === 403) {
    return (
      "OpenAI denied access to the image model (403). Using gpt-image-1 often " +
      "requires verifying your organization at platform.openai.com/settings/organization/general. " +
      detail
    ).trim();
  }
  if (res.status === 429) {
    return (
      "OpenAI quota/rate limit hit (429). The account needs image credits — " +
      "check your plan and billing at platform.openai.com/account/billing. " +
      detail
    ).trim();
  }
  return `OpenAI image request failed (${res.status}). ${detail}`.trim();
}

/**
 * Generate an image from a text prompt using OpenAI (default: gpt-image-1).
 * Returns a base64 data URL ready to drop into an <img src>.
 */
export async function generateImage(
  prompt: string,
  model: string = IMAGE_MODEL
): Promise<string> {
  const res = await fetch(`${OPENAI_BASE}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: IMAGE_SIZE,
      quality: IMAGE_QUALITY,
    }),
  });

  if (!res.ok) {
    throw new Error(await readError(res));
  }

  const data = (await res.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };
  const first = data.data?.[0];

  // gpt-image-1 always returns base64; dall-e models can return a URL.
  if (first?.b64_json) {
    return `data:image/png;base64,${first.b64_json}`;
  }
  if (first?.url) {
    return first.url;
  }
  throw new Error("OpenAI did not return an image.");
}
