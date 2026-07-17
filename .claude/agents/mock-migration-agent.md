---
name: mock-migration-agent
description: Use this agent to migrate a feature still backed by lib/mockData.ts onto real MongoDB-backed logic, following this repo's established Holding/Activity/Watchlist precedent. Invoke it when asked to "make X real", remove mock data for a feature, or wire a dashboard/portfolio/alerts section to the database instead of static arrays.
tools: Read, Write, Edit, Grep, Glob, Bash
model: sonnet
---

FinSight AI is being migrated feature-by-feature off `lib/mockData.ts` onto real per-user MongoDB data. Holdings, Activity, and the price Watchlist are already fully migrated — use them as the reference pattern (`models/Holding.ts` + `lib/portfolio.ts`, or the simpler `models/Activity.ts` + `lib/activity.ts` + `app/api/activity/route.ts`).

**The established pattern, in order:**
1. **Mongoose model** (`models/<Name>.ts`) — schema with `userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }` plus the feature's fields with `required`/`trim`/`maxlength`/`enum`/`min` validators as appropriate, `{ timestamps: true, collection: "<Name>" }`, and the `export const X = models.X || model("X", xSchema)` guard (avoids Mongoose's hot-reload "Cannot overwrite model" error). Export a `type XDocument = HydratedDocument<InferSchemaType<typeof xSchema>>`.
2. **`lib/<feature>.ts` helper module** — a `serialize<Name>()` function converting a Mongoose document into the plain shape the frontend expects (matching the existing mock interface's field names where possible so components need minimal changes), plus any pure helper logic (e.g. `formatActivityTimestamp` in `lib/activity.ts`) as separately-testable pure functions rather than inlined in the route.
3. **API route** (`app/api/<feature>/route.ts`) — `getAuthenticatedUserId()` from `@/lib/session` first, return 401 if absent; `connectToDatabase()`; query scoped to `{ userId }`; map through the `serialize<Name>()` helper; return `Response.json({ <feature>: [...] })`. Keep routes as thin orchestrators — real logic belongs in `lib/`.
4. **Route test** — write via the `test-writer` agent's mocked route-handler convention (`vi.mock` of `next/headers`, `@/lib/db/connect`, and the model module).
5. **Component wiring** — replace the component's `import { x } from "@/lib/mockData"` with a fetch to the new route (check `lib/AppContext.tsx` and existing migrated pages like the dashboard/watchlist pages for the client-side fetch pattern already in use), and remove the now-unused export from `lib/mockData.ts` once nothing imports it.

**Current candidates still on mock data** (verified directly against `lib/mockData.ts` and its importers — check again before starting, since this list will go stale as migrations land):
- `kpiData`'s two entries — Risk Score and AI Insights (`app/dashboard/page.tsx`) — the file's own comment notes Total Portfolio Value and Today's P&L are already computed from real holdings; only these two remain mock.
- `alerts` (`app/alerts/page.tsx` / `components/alerts/AlertCard.tsx`).
- `aiInsights` (`components/dashboard/AIInsightBanner.tsx`).
- `portfolioChartData` and `performanceHistory` (chart components under `components/portfolio/` and `components/dashboard/`) — these need a real historical time-series source (e.g. periodic snapshots of portfolio value), which is a bigger design question than the others; flag this to the user rather than assuming an approach.
- `watchlistStocks` — no longer imported anywhere (the real `Watchlist` model + `app/api/watchlist/**` already superseded it per commit history); this export is now dead code. If asked to clean it up, just delete it — don't "migrate" something already migrated.

Migrate one feature at a time, matching the pattern above exactly. After each migration, run `npm test` and confirm the feature's page still renders correctly against the new route before moving to the next candidate.
