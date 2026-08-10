import type { Json } from "@/supabase/types";

// A section config (HeroBannerConfig, PromoCarouselConfig, ...) is a plain
// TS interface with no index signature, so it isn't structurally assignable
// to the recursive Json union without a cast. Rather than an opaque
// `as unknown as Json`, round-trip through JSON so the result is verified —
// not just asserted — to contain only JSON-safe values before the single
// remaining cast.
export function toJson<T>(value: T): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
