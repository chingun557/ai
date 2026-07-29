import { NextResponse } from "next/server";
import { generateJson } from "@/lib/gemini";

export const runtime = "nodejs";

type IngredientResult = {
  dish: string;
  ingredients: string[];
  notes?: string;
};

export async function POST(req: Request) {
  try {
    const { text } = (await req.json()) as { text?: string };

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Please provide a dish name or description in the 'text' field." },
        { status: 400 }
      );
    }

    const prompt =
      `You are a culinary assistant. Read the following text and identify the food dish and its ingredients.\n\n` +
      `Text: "${text.trim()}"\n\n` +
      `Respond ONLY with valid JSON in exactly this shape, no markdown fences:\n` +
      `{"dish": "<best guess of the dish name>", "ingredients": ["ingredient 1", "ingredient 2"], "notes": "<optional short note>"}\n` +
      `List the most likely ingredients. If the text is not about food, return an empty ingredients array and explain in notes.`;

    const result = await generateJson<IngredientResult>(prompt);

    return NextResponse.json({
      dish: result.dish ?? "",
      ingredients: Array.isArray(result.ingredients) ? result.ingredients : [],
      notes: result.notes ?? "",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
