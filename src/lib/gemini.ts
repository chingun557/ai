import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Server-only Gemini helper.
 *
 * The API key lives in GEMINI_API_KEY and must never be exposed to the browser,
 * so this module is only ever imported from route handlers (`src/app/api/**`).
 */

// gemini-2.5-flash is multimodal (text + vision) and available on the free tier;
// gemini-2.0-flash has a 0 free-tier quota, so it is not a good default.
const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

// Image generation uses a native image-output model ("Nano Banana" by default).
const DEFAULT_IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image";
const GENAI_BASE = "https://generativelanguage.googleapis.com/v1beta";

function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local and restart the dev server."
    );
  }
  return apiKey;
}

function getClient() {
  return new GoogleGenerativeAI(getApiKey());
}

/** Generate plain text from a single prompt. */
export async function generateText(
  prompt: string,
  model: string = DEFAULT_MODEL
): Promise<string> {
  const client = getClient();
  const genModel = client.getGenerativeModel({ model });
  const result = await genModel.generateContent(prompt);
  return result.response.text().trim();
}

/** Gemini sometimes wraps JSON in ```json fences — strip them before parsing. */
function parseLooseJson<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

/**
 * Ask Gemini to return strict JSON and parse it.
 */
export async function generateJson<T = unknown>(
  prompt: string,
  model: string = DEFAULT_MODEL
): Promise<T> {
  return parseLooseJson<T>(await generateText(prompt, model));
}

/**
 * Multimodal: send image bytes + a text prompt to Gemini and get text back.
 * Works on the free tier (unlike image *generation*).
 */
export async function generateTextFromImage(
  prompt: string,
  imageBytes: ArrayBuffer,
  mimeType: string,
  model: string = DEFAULT_MODEL
): Promise<string> {
  const client = getClient();
  const genModel = client.getGenerativeModel({ model });
  const result = await genModel.generateContent([
    {
      inlineData: {
        data: Buffer.from(imageBytes).toString("base64"),
        mimeType,
      },
    },
    { text: prompt },
  ]);
  return result.response.text().trim();
}

/** Same as generateTextFromImage, but parses the reply as JSON. */
export async function generateJsonFromImage<T = unknown>(
  prompt: string,
  imageBytes: ArrayBuffer,
  mimeType: string,
  model: string = DEFAULT_MODEL
): Promise<T> {
  return parseLooseJson<T>(
    await generateTextFromImage(prompt, imageBytes, mimeType, model)
  );
}

/** Turn a Gemini image-endpoint error response into a readable message. */
async function readImageError(res: Response): Promise<string> {
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
  // Free-tier keys report a 0 quota for image models — surface the real fix.
  if (res.status === 429) {
    return (
      "Image generation is unavailable on this API key's free tier " +
      "(quota is 0 for image models). Enable billing on the key's Google " +
      "Cloud project to use image generation. Original message: " +
      detail
    );
  }
  return `Gemini image request failed (${res.status}). ${detail}`.trim();
}

/**
 * Generate an image from a text prompt using a Gemini native image model
 * (default: gemini-2.5-flash-image, aka "Nano Banana"). Returns a base64 data
 * URL ready to drop into an <img src>.
 *
 * Uses the REST API directly (rather than the SDK) so we can request the IMAGE
 * response modality and read the returned inline image bytes reliably.
 */
export async function generateImage(
  prompt: string,
  model: string = DEFAULT_IMAGE_MODEL
): Promise<string> {
  const res = await fetch(`${GENAI_BASE}/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": getApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
  });

  if (!res.ok) {
    throw new Error(await readImageError(res));
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      finishReason?: string;
      content?: {
        parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }>;
      };
    }>;
  };

  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const image = parts.find((p) => p.inlineData?.data)?.inlineData;
  if (!image?.data) {
    const reason = data.candidates?.[0]?.finishReason;
    throw new Error(
      `Gemini did not return an image${reason ? ` (finishReason: ${reason})` : ""}. ` +
        "Try rephrasing the prompt."
    );
  }

  const mime = image.mimeType || "image/png";
  return `data:${mime};base64,${image.data}`;
}
