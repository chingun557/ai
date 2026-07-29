"use client";

import { useState } from "react";
import { Wand2, ImageIcon, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ImageResponse = { image: string; error?: string };

export function ImageCreator() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setImage(null);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data: ImageResponse = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed.");
      setImage(data.image);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Wand2 className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Image creator</h2>
      </div>

      <p className="text-sm text-muted-foreground">
        Describe a dish and AI will generate a food image for it.
      </p>

      <div className="space-y-2">
        <Label htmlFor="image-prompt">Prompt</Label>
        <Input
          id="image-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. A bowl of ramen with a soft-boiled egg"
          onKeyDown={(e) => {
            if (e.key === "Enter") onGenerate();
          }}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={onGenerate} disabled={!prompt.trim() || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Generating…" : "Generate"}
        </Button>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          <h3 className="text-lg font-semibold underline decoration-2 underline-offset-4">
            Generated image
          </h3>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!image && !error && !loading && (
          <p className="text-sm text-muted-foreground">
            Enter a prompt above to create an image.
          </p>
        )}

        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Painting your dish…
          </p>
        )}

        {image && (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt="Generated food"
              className="max-h-96 rounded-lg border object-contain"
            />
            <a href={image} download="generated-food.png">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
