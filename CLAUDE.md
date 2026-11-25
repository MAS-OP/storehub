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
- **Platform admin** (`app/platform-admin/*`): real Supabase Auth session + a `platform_admins` allowlist table (RLS-locked, zero client-facing policies), checked via the `is_platform_admin()` SECURITY DEFINER RPC and enforced in `lib/auth/platform-admin.ts`'s `requirePlatformAdmin()`. MFA/AAL2 is **not yet enforced** — no `/platform-admin/login` or `/platform-admin/mfa-challenge` pages exist yet, so don't assume step-up auth is in place.
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

This system is mid-buildout: the drag-and-drop admin editor (phases 3 and 3.5) is complete; the next official phase is Phase 4 (live storefront wiring); only a subset of section types have renderer components so far.

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

- `app/platform-admin` auth uses a real session + allowlist table now, but has no MFA/step-up enforcement yet — treat privileged actions there as provisional until that lands.
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
  - Very long multi-line pastes (a Python heredoc, a big `cat > file << EOF`) can silently truncate or garble in this terminal — for anything non-trivial in size, deliver it as a draggable file plus a short one-line run/move command instead of a big paste.
  - Curly/smart quotes introduced by copy-paste around a bracket path segment like `[locale]` break both quoting (bash sees them as literal characters, not real quotes) and globbing (`[locale]` gets read as a character class) — use backslash-escaping (`app/\[locale\]/...`) instead of quote marks for any path containing `[locale]`.
  - `tsc --noEmit` exiting 0 only proves the files currently on disk are type-correct — it does **not** prove a `mv`/edit actually landed where intended. After any move, grep the destination file for content unique to the new version before trusting it.
  - VS Code's Problems panel can show stale diagnostics tied to a file's old name/path after it's been moved or renamed externally (via terminal) — it doesn't reflect reality until tabs are closed or the window is reloaded; trust a fresh `tsc --noEmit` run over the panel's count.

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
| — Onyx landing preview | 🔀 Isolated route, 4/7 sections | app/[locale]/preview/onyx, components/preview/onyx/* | hero + how-it-works + features + ai-spotlight built; pricing/testimonials/final-cta remain |

**Standing rule:** at the end of every session, before finishing, update the
table above to reflect what was actually built — mark rows done/not-done,
note any deviation from spec (a type swapped, a step skipped). Do this
without being asked.

## Decision log
- 10 Aug 2026: Landing page settled — keeping the existing ParticleBackground
  + terracotta design (already same stack, already working). Axon dropped
  permanently. If app/[locale]/preview/axon exists, it's dead code — delete it.
  Remaining real task on the landing page: replace placeholder stats/testimonials
  before any real launch.

## Decision log (correction — same day)
- 10 Aug 2026, later: REVERSED the entry above. Actually want the Axon
  identity built — implement it tomorrow BEFORE Phase 4. Silver lining:
  /preview/axon was confirmed never built (real 404 from inside the
  Codespace), so there's no dead code to clean up from the earlier attempt —
  tomorrow's build starts clean, not on top of a half-built preview.

## Decision log (27 Aug 2026)
- Re-prioritized: finishing the Axon/Onyx marketing themes takes priority
  over platform-admin MFA and store-level permissions/audit-trail work — the
  platform hasn't launched and operational tables are still empty, so
  security work there can wait until real stores exist.
- Built out real platform-admin auth this session (Supabase Auth + allowlist
  table + RPC), ahead of the 10 Aug plan — see the updated Auth &
  authorization section above. MFA still not enforced.
- Onyx: hero redesigned (smaller headline, hover-reveal ownership icons,
  denser background, ar/en language switch fixed) and a how-it-works section
  added. Which theme (Axon or Onyx) finishes first is still undecided.

## Rules and lessons added 25 Nov 2026
- **One store per owner.** Enforced twice: the `/create` page checks for an existing store (redirects a logged-in owner to `/admin`, and blocks insert with a notice), and the database has a unique constraint `stores_owner_id_key` on `stores(owner_id)` (migration `20261125120000_stores_one_per_owner.sql`). Admin pages rely on `.single()` per owner, so several stores per owner break them (406 and empty sections).
- **After a Codespace rebuild**, git-ignored files vanish: recreate `.env.local` (7 variables: Supabase URL, publishable key as `NEXT_PUBLIC_SUPABASE_ANON_KEY`, secret key as `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_ROOT_DOMAIN`, `PLATFORM_ADMIN_EMAIL`, `RESEND_API_KEY`, `MOYASAR_SECRET_KEY`) and re-run `pnpm exec supabase login` then `link --project-ref udbknwlpxbszgmlfvjvg`. Use `pnpm exec supabase`, not `pnpx` (pnpx fetches a different CLI version and may target a local DB).
- Supabase legacy API keys are retired in early 2027; the project already uses `sb_publishable_` / `sb_secret_` keys. Never paste secret keys into chats.
- In the terminal, escape bracket paths with backslashes: `app/\[locale\]/...`.
- Do not commit regenerated `supabase/types.ts` when the diff is only generator noise (parentheses, PostgrestVersion).
