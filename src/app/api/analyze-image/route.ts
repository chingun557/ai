import { NextResponse } from "next/server";
import { generateJsonFromImage } from "@/lib/gemini";

// Image bytes can be large-ish; make sure we use the Node runtime.
export const runtime = "nodejs";

type Analysis = { caption: string; summary: string };

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No image file was provided (field name must be 'image')." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const mimeType = file.type || "image/jpeg";

    // Gemini looks at the photo directly (multimodal) and returns both a short
    // caption and a friendly summary + likely ingredients, as JSON.
    const { caption, summary } = await generateJsonFromImage<Analysis>(
      `You are looking at a photo. Respond with ONLY a JSON object (no markdown, ` +
        `no code fences) of the shape {"caption": string, "summary": string}.\n\n` +
        `- "caption": a short one-line description of what's in the photo.\n` +
        `- "summary": if it's food, a friendly 2-3 sentence summary of what the ` +
        `dish likely is, followed by its probable ingredients as a simple ` +
        `bulleted list (use "- " for bullets). If it is not food, politely say so.`,
      bytes,
      mimeType
    );

    return NextResponse.json({ caption, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
