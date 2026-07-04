# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev     # start dev server (localhost:3000)
npm run build   # production build
npm run start   # run production build
```

There is no lint or test script configured in `package.json`, and no test files exist in the repo.

## Architecture

FinSight AI is a Next.js App Router frontend for an AI-powered finance dashboard (portfolio analytics, RAG-style document Q&A chat, market alerts). Domain data (holdings, KPIs, chat history, documents, alerts, etc.) still comes entirely from `lib/mockData.ts`, and every page/component that reads it is a client component (`"use client"`). The only real backend surface is authentication (see below) — there is no database-backed portfolio/chat/document data yet.

### Page structure

Each route under `app/` (`dashboard`, `portfolio`, `chat`, `documents`, `alerts`, `settings`) follows the same shape: a `"use client"` page component that wraps its content in `<DashboardShell>` and pulls typed mock data from `lib/mockData.ts` into feature components under `components/<feature>/`.

- `components/layout/DashboardShell.tsx` — the shared authenticated-app frame (renders `Sidebar` + `Topbar`, offsets `<main>` by the sidebar width).
- `components/layout/Sidebar.tsx` / `Topbar.tsx` — nav chrome; active route via `usePathname()`.
- `components/ui/*` — shadcn/ui primitives (button, card, dialog, table, tabs, tooltip, etc.).
- `components/<feature>/*` — feature-specific presentational components (dashboard, portfolio, chat, documents, alerts), each typically consuming one or more exports from `lib/mockData.ts`.

### State

`lib/AppContext.tsx` is a single global React context (`AppProvider`/`useApp`) holding UI-only state (`activeNav`, `sidebarCollapsed`, `darkMode`) plus the authenticated user (`user`, `userLoading`, `logout()` — fetched from `/api/auth/me` on mount). It's mounted once in `app/layout.tsx`, above `TooltipProvider`. Dark mode is applied by toggling `dark`/`light` classes on `document.documentElement`. There is still no data-fetching/server-state layer for domain data (no React Query, SWR, etc.) — mock data is imported directly into components.

### Authentication

MongoDB (Mongoose ODM) backs a single `User` collection (`models/User.ts`: `name`, `email`, bcrypt-hashed `password`). Sessions are a JWT (`jsonwebtoken`) stored in an `httpOnly` cookie (`finsight_session`, see `lib/auth.ts` for signing/verification and cookie options). `lib/db/connect.ts` caches the Mongoose connection across hot-reloads/serverless invocations.

- `app/api/auth/register`, `/login`, `/logout`, `/me` — route handlers under `app/api/auth/*`; each verifies its own inputs/session rather than trusting Proxy alone.
- `proxy.ts` (root) — Next 16 renamed `middleware.ts` to `proxy.ts`. Redirects unauthenticated requests to `/login` (except `/login`, `/register`, `/api/*`, static assets) and redirects authenticated users away from `/login`/`/register` to `/dashboard`.
- `app/login/page.tsx`, `app/register/page.tsx` — public, unauthenticated pages (no `DashboardShell`).
- Env vars: `DATABASE_URL` (MongoDB Atlas connection string — note the password must be percent-encoded if it contains special characters), `JWT_SECRET`, `JWT_EXPIRES_IN`.

### Mock data

`lib/mockData.ts` is the single source of truth for all domain types and sample data (`Holding`, `KPI`, `ChatMessage`, `Document`, `Alert`, `WatchlistStock`, `MarketMover`, `AllocationData`, `PerformancePoint`, `ActivityItem`, etc., plus their corresponding data arrays). When adding a new data-driven feature, add the type + mock array here first, matching the existing interface style, rather than inlining data in components.

### Styling

Tailwind CSS v4 (see `app/globals.css`), shadcn/ui configured via `components.json` with `style: "base-nova"`, `baseColor: "neutral"`, no class prefix, and aliases `@/components`, `@/lib`, `@/components/ui`, `@/hooks`. Path alias `@/*` maps to the repo root (`tsconfig.json`). The app is dark-mode-first (`className="... dark"` hardcoded on `<html>` in `app/layout.tsx`); `AppContext`'s `darkMode` toggle is layered on top of that default. Fonts are `next/font/google` (`Inter`, `JetBrains_Mono`) exposed as CSS variables.

