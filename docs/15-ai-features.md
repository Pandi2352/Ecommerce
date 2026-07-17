# 15 · AI Features (Phase 30 & beyond)

AI is a first-class part of this platform, not an afterthought. This doc expands
**Phase 30** of [09-roadmap.md](./09-roadmap.md) with concrete features, the
integration architecture, and the concepts each one teaches.

> **Model choice:** default to the latest, most capable Claude models (Opus 4.8 /
> Sonnet 5) via the Anthropic API for generation, RAG, and agents. Use a small/fast
> model (Haiku) for high-volume, low-latency tasks (alt text, classification).

## AI integration architecture

```
frontend  → POST /ai/<task>  (NestJS)
backend   → ai module:
            ├─ AiService        # provider client (Anthropic), prompt templates
            ├─ embeddings       # store vectors in MongoDB Atlas Vector Search
            ├─ guardrails       # input validation, cost caps, output schema (Zod)
            └─ (queues later ⏳) # BullMQ for bulk/async — deferred
```

- **Sync (for now)** — all AI tasks run in-request to start, including bulk ones
  (process in batches, cap the size). Simplest to build first.
- **Async (⏳ later)** — move bulk/expensive tasks (summarize 10k reviews, regenerate
  all SEO) to **BullMQ + Redis**, notifying via the realtime gateway. Deferred until
  the Redis/queue phase; the endpoint contract stays the same.
- **RAG** uses **MongoDB Atlas Vector Search** over product/order/content embeddings.
- Every AI endpoint: rate-limited, cost-capped, validated input, **structured output
  validated with Zod**, and logged (see [Phase 27](./09-roadmap.md)).

---

## Core AI features

### 1. AI product description generator
🧠 Prompting, structured output.
Input product attributes (name, brand, specs, category) → generate a polished,
on-brand description. Tone/length controls; regenerate; accept/edit before save.
`POST /ai/product/description`.

### 2. AI SEO title & meta generator
🧠 Constrained generation.
Generate SEO meta title (≤60 chars) + meta description (≤160 chars) + keyword
suggestions from a product. Bulk mode over a category (async job).
`POST /ai/product/seo`.

### 3. AI image alt-text generator
🧠 Vision + high-volume batching (Haiku).
Generate accessible alt text for product images; batch across the gallery.
`POST /ai/image/alt-text`.

### 4. AI review summarizer
🧠 Map-reduce summarization.
Summarize N reviews per product into pros/cons + an overall sentiment + a one-line
takeaway. Recomputed by an async job when new reviews arrive.
`POST /ai/reviews/summarize`.

### 5. AI shopping assistant (RAG)
🧠 Retrieval-augmented generation, embeddings, vector search.
Customer-facing chat that answers "which laptop under ₹80k for video editing?" by
retrieving relevant products (vector search) + grounding the answer in real catalog
data. Returns product cards, not just text.
`POST /ai/assistant/chat` (streaming).

### 6. AI product recommendation engine
🧠 Embeddings + similarity, hybrid ranking.
"Similar products" and "you may also like" from embedding similarity + behavioral
signals (recently viewed, co-purchase). Powers cross-sell/upsell (Phase 4) and the
storefront.
`GET /ai/recommendations?productId=` / `?userId=`.

### 7. AI support chatbot
🧠 Tool-use agent.
Order-aware support bot that can look up order status, initiate a return, or answer
policy questions (RAG over CMS pages). Uses tool-calling to hit internal endpoints
with the user's own permissions.
`POST /ai/support/chat` (streaming, tool-use).

### 8. AI sales insights
🧠 Analytics narration.
Turn dashboard aggregates into plain-language insights: "Revenue up 18% WoW, driven
by Electronics; 3 SKUs are trending — consider restocking." Runs on a schedule.
`GET /ai/insights/sales`.

### 9. AI inventory forecasting
🧠 Time-series reasoning + structured output.
Predict demand per SKU from sales history + seasonality → restock recommendations
with quantities and confidence. Feeds the dashboard's AI restock widget (doc 05).
`GET /ai/insights/forecast`.

---

## Cross-cutting AI concerns

| Concern | Approach |
|---------|----------|
| **Cost control** | Per-user/day token caps; cache identical prompts; prefer Haiku for bulk. |
| **Latency** | Stream chat responses; async-queue bulk generation. |
| **Safety** | Validate + sanitize inputs; never expose secrets in prompts; output schema via Zod. |
| **Grounding** | RAG for anything catalog/policy-specific — don't let the model invent SKUs or prices. |
| **Observability** | Log prompt, model, tokens, latency, cost per call (Winston, Phase 27). |
| **Permissions** | The support agent acts with the requesting user's RBAC — no privilege escalation. |
| **Auditability** | AI-generated content is flagged and diff-reviewable before publish. |

## Backend module

`backend/src/ai/` — `ai.module.ts`, `ai.controller.ts`, `ai.service.ts`,
`embeddings.service.ts`, `prompts/`, `queues/`, DTOs (Zod schemas shared with
frontend). Depends on `config` (API keys), `products` / `orders` / `reviews`
(context), and MongoDB Atlas Vector Search. (BullMQ/Redis for async jobs is added
later ⏳.)

## Suggested build order

Start with **stateless generators** (1, 2, 3) — highest value, lowest complexity.
Then **summarization** (4). Then the **RAG + embeddings** track (5, 6, 7) once you've
set up vector search. Finally the **analytics AI** (8, 9), which reuses the Phase 26
aggregations.

> Before implementing, consult the Anthropic API reference for model IDs, pricing,
> streaming, tool-use, and prompt caching.
