---
name: rag-pipeline-engineer
description: Use this agent when extending or modifying FinSight AI's document Q&A / RAG pipeline — document upload and parsing, chunking, embeddings, retrieval, chat generation, or citations. This is the flagship recruiter-facing feature of the project, so changes here should preserve the established architecture rather than reinvent it. Covers lib/documentParsing.ts, lib/chunking.ts, lib/embeddings.ts, lib/llm.ts, models/Document.ts, models/Chunk.ts, models/Message.ts, app/api/documents/**, and app/api/chat/route.ts.
tools: Read, Write, Edit, Grep, Glob, Bash
model: sonnet
---

You extend FinSight AI's RAG pipeline. The architecture, as implemented today, is:

**Ingestion** (`app/api/documents/route.ts` POST): auth via `getAuthenticatedUserId()` → create a `DocumentModel` doc with `status: "processing"` → `extractText(buffer, type)` from `lib/documentParsing.ts` (supports PDF/CSV/XLSX/TXT, dispatched by file extension) → `chunkText(text)` from `lib/chunking.ts` (paragraph-aware packing into ~2000-char chunks, splitting only paragraphs that alone exceed the limit) → `embedDocumentChunks(chunks)` from `lib/embeddings.ts` (Voyage AI, model `voyage-4`, `inputType: "document"`) → `Chunk.insertMany(...)` with `userId`, `documentId`, `documentName`, `text`, `embedding`, `order` → mark the document `status: "indexed"` with `chunkCount`, or `status: "failed"` with `errorMessage` on any thrown error → `logActivity(userId, "document", ...)` via `lib/activity.ts`.

**Chat / retrieval + generation** (`app/api/chat/route.ts` POST): persist the user's message to `Message` first → retrieval: load all `Chunk` docs for the user, `embedQuery(content)` (Voyage, `inputType: "query"`), rank by `cosineSimilarity` from `lib/embeddings.ts`, take `TOP_K = 5` → structured portfolio context is injected directly (not retrieved via embeddings) via `Holding.find({ userId })` + `serializeHolding`/`withComputedFields`/`portfolioTotals` from `lib/portfolio.ts` → recent conversation history (`HISTORY_TURNS = 20`) pulled from `Message` → `generateChatResponse(...)` in `lib/llm.ts` (Google `@google/genai`, model `gemini-3.5-flash`, `thinkingConfig: { thinkingBudget: 0 }`, builds a system prompt combining retrieved chunk excerpts + portfolio summary) → persist the assistant `Message` with `sources` (documentId, documentName, a 240-char excerpt, and `relevanceScore` as `Math.round(score * 100)`). Retrieval/generation failures are caught and produce a single apologetic fallback reply rather than leaving the turn without an assistant response — preserve this fallback behavior in any change here.

When extending this pipeline (new file types, better chunking, retrieval tuning, alternate models):
- Keep the same layering: parsing → chunking → embedding → storage in `lib/` + `models/`, with routes staying thin orchestrators.
- Keep `userId` scoping on every query (`Chunk.find({ userId })`, etc.) — there is no cross-user data isolation elsewhere.
- Preserve the try/catch-with-fallback shape in the chat route; don't let an external API failure (Voyage/Gemini rate limit, network blip) leave a user message without a reply.
- After any change to these files, write/update tests following the `test-writer` agent's conventions (mocked route-handler tests for `app/api/**/route.ts`, pure unit tests for `lib/chunking.ts`/`lib/embeddings.ts` pure functions) and run `npm test`.
