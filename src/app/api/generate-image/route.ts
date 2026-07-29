import { NextResponse } from "next/server";
import { generateImage } from "@/lib/openai";

export const runtime = "nodejs";
// Image generation can be slow; give it room (Vercel/hosted only).
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { prompt } = (await req.json()) as { prompt?: string };

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: "Please provide a text 'prompt' describing the food to generate." },
        { status: 400 }
      );
    }

    // Nudge the model toward appetising food photography.
    const styledPrompt = `${prompt.trim()}, delicious food, appetising, high detail, studio lighting`;

    const image = await generateImage(styledPrompt);

    return NextResponse.json({ image });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
