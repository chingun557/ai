"use client";

import { useState } from "react";
import { UtensilsCrossed, ListChecks, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type IngredientResponse = {
  dish: string;
  ingredients: string[];
  notes?: string;
  error?: string;
};

export function IngredientRecognition() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IngredientResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onDetect() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data: IngredientResponse = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <UtensilsCrossed className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Ingredient recognition</h2>
      </div>

      <p className="text-sm text-muted-foreground">
        Describe a dish (name or a sentence) and Gemini will list its likely
        ingredients.
      </p>

      <div className="space-y-2">
        <Label htmlFor="ingredient-text">Dish or description</Label>
        <Textarea
          id="ingredient-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Beef stroganoff with mushrooms and sour cream"
          rows={4}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={onDetect} disabled={!text.trim() || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Detecting…" : "Detect ingredients"}
        </Button>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5" />
          <h3 className="text-lg font-semibold underline decoration-2 underline-offset-4">
            Ingredients
          </h3>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!result && !error && !loading && (
          <p className="text-sm text-muted-foreground">
            Enter a dish above to see its ingredients.
          </p>
        )}

        {result && (
          <div className="space-y-3 text-sm">
            {result.dish && (
              <p>
                <span className="font-medium">Dish:</span> {result.dish}
              </p>
            )}
            {result.ingredients.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5">
                {result.ingredients.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No ingredients detected.</p>
            )}
            {result.notes && (
              <p className="text-muted-foreground">{result.notes}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
