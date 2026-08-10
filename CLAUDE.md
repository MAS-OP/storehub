# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

StoreHub — a multi-tenant e-commerce SaaS platform (Shopify/Salla-style) where merchants create a subdomain storefront (`{subdomain}.storehub.sa`). Primary market/language is Arabic; UI is bilingual (ar/en).

## Commands

```bash
pnpm dev      # start dev server (Turbopack), default port 3000
pnpm build    # production build
pnpm start    # run production build
pnpm lint     # next lint
```

There is no test runner configured in this repo.

Package manager is pnpm (`packageManager: pnpm@10.12.4` in package.json) — don't use npm/yarn.

## Architecture

### Multi-tenant routing (middleware.ts)

A single `middleware.ts` handles three concerns based on the request `Host` header:
- **Store subdomain** (`{subdomain}.storehub.sa`, or `{subdomain}.localhost` in dev, or `{subdomain}---branch.vercel.app` on Vercel previews): rewrites the request to `/store/[subdomain]/...`. Platform-admin is blocked on store subdomains.
- **`/platform-admin`**: skips i18n entirely (no locale prefix).
- **Everything else** (main domain): routed through `next-intl`'s middleware for locale handling.

This means the app has three independent route trees living side by side:
- `app/[locale]/...` — marketing site, merchant auth, merchant admin panel (locale-prefixed)
- `app/store/[subdomain]/...` — the live storefront a shopper sees (no locale prefix; store's own locale/RTL is handled per-page)
- `app/platform-admin/...` — internal StoreHub operator console (no locale prefix)

When adding a route, decide which of these three trees it belongs to — they have different layouts, different auth models, and (for `app/[locale]`) different locale handling.

### i18n (i18n.ts + messages/{ar,en}.json)

- `defaultLocale = "ar"`, `localePrefix: "as-needed"` — Arabic is served at `/` with no prefix; English lives at `/en`. Do not change this without an explicit request; it's a settled decision.
- Every UI string ships in both `messages/ar.json` and `messages/en.json`.
- Several DB tables/configs also carry paired `_ar`/`_en` (or `title_ar`/`title_en`, etc.) columns directly, separate from the `messages/*.json` UI-string files — see `lib/sections/types.ts` for the pattern used by storefront section configs.
- RTL: Arabic-rendering UI needs explicit `dir="rtl"`; layouts pick `dir` from the current locale (see `app/[locale]/admin/layout.tsx`). The Cairo font is the Arabic display font.

### Auth & authorization model

Three distinct, non-overlapping auth checks — don't conflate them:
- **Merchant admin** (`app/[locale]/admin/*`): Supabase Auth session required; the layout looks up the `stores` row where `owner_id = user.id`. No store yet → redirect to `/[locale]/create`. This is the standard RLS-scoped client (`supabase/server.ts`).
- **Platform admin** (`app/platform-admin/*`): currently just an email allowlist check (`user.email === process.env.PLATFORM_ADMIN_EMAIL`) — **not real role-based auth**. This is known-weak and flagged for a future proper fix (Supabase Auth + `role` column + RLS + middleware role check, or a stopgap password gate). Don't assume it's hardened.
- **Storefront** (`app/store/[subdomain]/*`): public, no auth; scoped entirely by `subdomain` → `store.id` lookups.

### Supabase clients (supabase/*.ts)

Three separate client constructors — pick the right one per context, don't cross them:
- `supabase/client.ts` — browser client (anon key), for `'use client'` components.
- `supabase/server.ts` — server client (anon key, cookie-based session), for Server Components / route handlers acting as the current user. Respects RLS.
- `supabase/admin.ts` — service-role client (`adminSupabase`). Bypasses RLS entirely. Server-only, and only for platform-admin operations that legitimately need cross-tenant access — never use it as a shortcut around RLS in merchant-facing code.

`supabase/types.ts` is the hand-maintained `Database` type (no `supabase gen types` codegen pipeline in this repo) — when adding/changing a table, update this file directly, including `Relationships: []`.

### Storefront section system (lib/sections/*, components/sections/*)

Storefronts are composed of ordered, toggleable "sections" (hero banner, promo carousel, countdown offer, etc.) stored in the `store_sections` table (`config` is JSONB) — a lightweight visual page-builder, not a fixed template.

- `lib/sections/types.ts` — the `SectionType` union and one `*Config` interface per type, aggregated in `SectionConfigMap`. Adding a new section type means adding it here first.
- `lib/sections/registry.ts` — `SECTION_REGISTRY` maps each `SectionType` to its bilingual label, icon, and `defaultConfig()` factory. Keep this in sync with `types.ts`.
- `lib/sections/queries.ts` — all CRUD against `store_sections` (`getPublicSections` filters `is_active`; `getOwnerSections` doesn't; plus create/update/toggle/delete/reorder). Section `config` is cast through `Json` on the way in/out.
- `components/sections/*.tsx` — one renderer component per `SectionType`, consuming its typed config.

This system is mid-buildout: a drag-and-drop admin editor for reordering/configuring sections is the active next phase; only a subset of section types have renderer components so far.

### Styling

Tailwind v4 (CSS-first config via `@theme inline` in `app/globals.css` — no `tailwind.config.ts`). Design tokens are HSL CSS variables (`--background`, `--primary`, etc.) consumed through `--color-*` in `@theme`. Per-store branding (`store.primary_color`) is injected as an inline CSS custom property (`--store-primary`) on the storefront layout wrapper rather than through Tailwind config.

## Conventions

- TypeScript strict mode; avoid `any`.
- Server Components by default; add `'use client'` only where interactivity requires it.
- Always import via the `@/` absolute alias (mapped to repo root in `tsconfig.json`), never relative paths across directories.
- Supabase access goes through query functions that respect RLS; avoid raw SQL unless explicitly asked for.
- AI features (`app/api/ai`, `app/[locale]/admin/ai`) use the Anthropic SDK directly and are scoped as a **business-analyst assistant for the store owner** — not a storefront chatbot for shoppers.
- Payments: Moyasar is the first-choice gateway (mada/Saudi cards); Tap/HyperPay are alternates surfaced in the integrations page. Resend (email) and shipping (Aramex/SMSA) are configured per-store from `app/[locale]/admin/integrations`.

## Known rough edges

- `app/platform-admin` auth is an email-allowlist check, not a real session/role system — treat it as provisional if you touch it.
- Several admin pages (`create`, `integrations`, `notifications`) are still under active buildout — check current file contents rather than assuming completeness.

## Working Methodology & Source of Truth

- **The GitHub repo is not a reliable source of truth.** It was manually uploaded without real git history and can silently diverge from the actual project. Always verify against the live Codespace filesystem directly (read the actual file, run the actual command) rather than trusting what the repo appears to contain.
- **One terminal command per diagnostic step**, unless multiple steps are sequentially safe and chained with `&&`. Don't bundle unrelated diagnostics into one call.
- **Deliver full files on any edit, not partial diffs.** This is a project-specific preference — when a file changes, hand over the complete, ready-to-use file rather than a fragment.
- **Confirmatory grep before declaring any file "final."** Before treating an edited file as done, run a single consolidated grep confirming all agreed-upon fixes are actually present.
- **Technical verification before visual judgment.** Before any claim like "this looks broken" or "this looks faded," verify technically first (element size, console errors, computed styles) — aesthetic judgment comes only after the technical check confirms there's something real to see.
- **Explicit stop-and-assess when time-spent-to-value degrades.** If an issue is consuming disproportionate time for the value it delivers, stop and flag it explicitly rather than continuing open-ended iteration.
- **Known lessons (avoid repeating):**
  - `<canvas>` is a replaced element — `fixed inset-0` alone does not size it; it needs explicit `w-full h-full`.
  - Scope transparency/protection layers (overlays, blockers) to the actually-affected region only — don't apply them proactively to the whole page.
  - New files need an explicit, separate delivery/pull step — never assume a new file is bundled implicitly with the delivery of another file.

## Phase Status

| Phase | Status | Key files | Notes |
|---|---|---|---|
| 1 — DB schema/types/queries | ✅ Complete | lib/sections/types.ts, queries.ts | |
| 2 — Section components | ✅ Complete | components/sections/*.tsx | |
| 3 — Drag-drop admin editor | ✅ Complete | SectionsDragEditor.tsx | framer-motion Reorder, not @dnd-kit |
| 3.5 — In-section inspector | ✅ Complete | inspector/*.tsx | promo_carousel used, not product_grid (no renderer) |
| 4 — Live storefront wiring | ⏳ Not started | | |
| — Particle background/design tokens | ✅ Exists (uncommitted) | ParticleBackground.tsx | unrelated pre-existing system, origin unconfirmed |
| — Axon landing preview | 🔀 Isolated route only | app/[locale]/preview/axon | not a replacement for the live homepage |

**Standing rule:** at the end of every session, before finishing, update the
table above to reflect what was actually built — mark rows done/not-done,
note any deviation from spec (a type swapped, a step skipped). Do this
without being asked.
