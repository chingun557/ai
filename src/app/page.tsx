import { AiDemo } from "@/components/ai-demo";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold">AI Demo</h1>
        <p className="text-sm text-muted-foreground">
          Food ingredient recognition & image generation, powered by Gemini and
          Hugging Face.
        </p>
      </header>
      <AiDemo />
    </main>
  );
}
