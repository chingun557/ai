"use client";

import { useRef, useState } from "react";
import { Sparkles, FileText, RefreshCw, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type AnalyzeResponse = { caption: string; summary: string; error?: string };

export function ImageAnalysis() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    setFile(picked);
    setResult(null);
    setError(null);
    setPreview(picked ? URL.createObjectURL(picked) : null);
  }

  async function onGenerate() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const body = new FormData();
      body.append("image", file);
      const res = await fetch("/api/analyze-image", { method: "POST", body });
      const data: AnalyzeResponse = await res.json();
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
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Image analysis</h2>
        </div>
        <Button variant="outline" size="icon" onClick={reset} title="Reset">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Upload a food photo, and AI will detect the ingredients.
      </p>

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={onPick}
          className="hidden"
          id="image-analysis-file"
        />
        <label
          htmlFor="image-analysis-file"
          className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-accent"
        >
          <span className="font-medium">Choose File</span>
          <span className="text-muted-foreground">
            {file ? file.name : "JPG , PNG"}
          </span>
        </label>
      </div>

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Selected food"
          className="max-h-64 rounded-lg border object-contain"
        />
      )}

      <div className="flex justify-end">
        <Button onClick={onGenerate} disabled={!file || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Analyzing…" : "Generate"}
        </Button>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h3 className="text-lg font-semibold underline decoration-2 underline-offset-4">
            Here is the summary
          </h3>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!result && !error && !loading && (
          <p className="text-sm text-muted-foreground">
            First, enter your image to recognize an ingredients.
          </p>
        )}

        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
            Reading the photo and writing a summary…
          </p>
        )}

        {result && (
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Detected:</span>{" "}
              {result.caption}
            </p>
            <div className="whitespace-pre-wrap leading-relaxed">
              {result.summary}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
