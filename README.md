# AI Demo

A small **Next.js** demo that shows how to add AI to an app using **pre-trained models and APIs** — without training anything yourself.

It has three tabs:

| Tab | What it does | Powered by |
| --- | --- | --- |
| **Image analysis** | Upload a food photo → get a caption + a friendly summary of the dish and likely ingredients | Google Gemini (multimodal) |
| **Ingredient recognition** | Type a dish name/description → get its likely ingredients | Google Gemini |
| **Image creator** | Type a prompt → generate a food image | OpenAI `gpt-image-1` |

## Tech stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS 4** + **shadcn/ui**
- **Google Gemini** via `@google/generative-ai` (text + vision)
- **OpenAI Images** via `fetch` (text-to-image)

API keys stay on the server: every AI call goes through a Route Handler in
[`src/app/api/`](src/app/api), so the browser never sees your keys.

## 1. Get your API keys

- **Gemini** — https://aistudio.google.com/app/apikey (free tier covers the
  Image **analysis** and Ingredient tabs)
- **OpenAI** — https://platform.openai.com/api-keys (powers the Image
  **creator** tab; needs image credits, and `gpt-image-1` may require verifying
  your organization)

## 2. Configure the environment

Copy the example file and fill in your keys:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```env
GEMINI_API_KEY=your_real_gemini_key
OPENAI_API_KEY=your_real_openai_key
```

> Model names already have sensible defaults — override `GEMINI_MODEL` /
> `OPENAI_IMAGE_MODEL` in `.env.local` only if you want different ones.

## 3. Run it

```bash
npm install       # if you haven't already
npm run dev
```

Open http://localhost:3000.

## 4. Deploying

`.env.local` is **not** deployed (it's gitignored). If your live site shows
`"... _API_KEY is not set"`, it's because the host has no environment variables.
Set them in your host and **redeploy** — env vars only apply to builds that run
*after* they're saved.

**Vercel:** Settings → Environment Variables → add each of the following (for
Production + Preview), then Deployments → ⋯ → Redeploy.

**Netlify:** Site configuration → Environment variables → add them → Trigger a
new deploy.

| Variable | Required | Value |
| --- | --- | --- |
| `GEMINI_API_KEY` | ✅ | your Gemini key |
| `GEMINI_MODEL` | optional | `gemini-2.5-flash` |
| `OPENAI_API_KEY` | ✅ | your OpenAI key |
| `OPENAI_IMAGE_MODEL` | optional | `gpt-image-1` |
| `OPENAI_IMAGE_SIZE` | optional | `1024x1024` |
| `OPENAI_IMAGE_QUALITY` | optional | `medium` |

> `/api/generate-image` is unauthenticated and calls a **paid** OpenAI model.
> Before exposing it publicly, add rate limiting/auth or set a spend cap on the
> OpenAI account.

## Project structure

```
src/
├─ app/
│  ├─ page.tsx                     # main page (renders the tabs)
│  ├─ layout.tsx
│  └─ api/
│     ├─ analyze-image/route.ts    # Gemini vision → caption + summary
│     ├─ ingredients/route.ts      # Gemini ingredient list
│     └─ generate-image/route.ts   # OpenAI text-to-image
├─ components/
│  ├─ ai-demo.tsx                  # tab container
│  ├─ tabs/                        # one component per feature
│  └─ ui/                          # shadcn components
└─ lib/
   ├─ gemini.ts                    # server-only Gemini helper (text + vision)
   └─ openai.ts                    # server-only OpenAI image helper
```

## Notes & troubleshooting

- **Image creator errors (OpenAI)** — a `403` usually means `gpt-image-1` needs
  your OpenAI **organization verified**
  (platform.openai.com/settings/organization/general); a `429` means the account
  is out of **image credits** (platform.openai.com/account/billing). The route
  surfaces the exact reason in the UI.
- **Gemini model** — text and vision default to `gemini-2.5-flash`. Change
  `GEMINI_MODEL` in `.env.local` to use another. (Avoid `gemini-2.0-flash` — it
  currently has a 0 free-tier quota.)
- Restart `npm run dev` after changing `.env.local`.

## Concepts (quick reference)

- **Model** — a program trained on data to do a task (caption an image,
  generate text/images). Here we *use* pre-trained models, we don't train them.
- **API key / token** — a secret string that authorizes your requests. Keep it
  server-side (in `.env.local`), never in client code.
