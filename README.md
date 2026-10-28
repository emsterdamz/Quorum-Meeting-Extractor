# Quorum

Turn raw meeting transcripts into a clean, type-safe brief: an executive summary, the decisions that actually landed, and assigned action items with owners, due dates, and priorities.

Quorum ships with two extraction engines:

- **AI extraction** when `DEEPSEEK_API_KEY` is set. Uses DeepSeek JSON mode with a schema-guided prompt.
- **Local preview** when no key is present. A deterministic heuristic extractor keeps the demo fully functional without external calls.

Every response is validated with Zod before it reaches the UI, so the model must produce the documented shape or the request falls back to the local preview.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4 with custom editorial styling
- Zod 4 for request and response validation
- DeepSeek Chat Completions with JSON mode
- Lucide icons

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To enable AI extraction, add your key to `.env.local`:

```bash
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_MODEL=deepseek-flash
```

`DEEPSEEK_MODEL` is optional and defaults to `deepseek-flash`. `DEEPSEEK_BASE_URL` is also optional if you route through a proxy. Without a key, Quorum automatically uses the local preview engine and labels the output accordingly.

## API

`POST /api/extract`

```json
{
  "transcript": "Maya: Priya, can you send the pricing model by tomorrow?\nPriya: I'll send it by end of day.",
  "title": "Launch readiness",
  "meetingDate": "2026-10-28"
}
```

Response:

```json
{
  "analysis": {
    "meeting": {
      "title": "Launch readiness",
      "date": "2026-10-28",
      "durationMinutes": null,
      "participants": ["Maya", "Priya"]
    },
    "summary": "Maya and Priya aligned on the pricing handoff...",
    "keyDecisions": [],
    "actionItems": [
      {
        "id": "A1",
        "task": "Send the pricing model by end of day.",
        "owner": "Priya",
        "dueDate": "2026-10-28",
        "priority": "high",
        "sourceQuote": "I'll send it by end of day."
      }
    ]
  },
  "engine": "deepseek",
  "model": "deepseek-flash",
  "warnings": []
}
```

Try it with curl:

```bash
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"transcript":"Maya: We decided to ship Friday. Priya: I will send the final deck by Thursday.","meetingDate":"2026-10-28"}'
```

`GET /api/extract` returns the active engine and schema version.

## Data contract

The canonical shape lives in [`src/lib/schema.ts`](src/lib/schema.ts):

- `meeting`: title, ISO date, optional duration, participants
- `summary`: 2-4 sentence executive brief
- `keyDecisions`: settled outcomes with attribution and source quote
- `actionItems`: concrete tasks with owner, ISO due date or `null`, priority, and source quote

The same schema drives:

1. The JSON shape and rules in the DeepSeek prompt
2. Runtime response validation, with one automatic retry for malformed output
3. Inferred TypeScript types used by the API and UI

## Project layout

```text
src/
  app/
    api/extract/route.ts    # AI-first extraction with local fallback
    page.tsx                # Landing page and schema explainer
    globals.css             # Design system and responsive layout
  components/
    meeting-workbench.tsx   # Input, samples, uploads, extraction state
    analysis-view.tsx       # Brief, action checklist, JSON viewer
    brand.tsx
  lib/
    schema.ts               # Zod contract + inferred types
    deepseek-extractor.ts   # DeepSeek JSON-mode request + retry
    local-extractor.ts      # Deterministic no-key fallback
    dates.ts                # Relative date resolution
    samples.ts              # Demo transcripts
```

## Scripts

```bash
npm run dev        # Development server
npm run build      # Production build
npm run start      # Production server
npm run lint       # ESLint
npm run typecheck  # TypeScript without emitting
```

## Notes

- Transcripts are processed in memory and are not persisted.
- DeepSeek JSON mode guarantees JSON syntax, not a schema. Zod remains the source of truth; malformed responses are retried once before falling back to local preview.
- The local preview is useful for demos, but it is intentionally heuristic. Use the AI engine for production-quality summaries, owner inference, and relative-date handling.
- There is no authentication or rate limiting in this starter. Add both before exposing the extraction endpoint publicly.
