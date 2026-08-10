import { z } from "zod";

// Only section types with a real renderer component today get a schema here.
// (See components/sections/*.tsx — category_grid, product_grid, and
// testimonials have config shapes in types.ts but no renderer yet, so there's
// nothing for an inspector to safely edit for them.)
//
// Adding a brand-new SectionType (one not already in the store_sections.type
// CHECK constraint) is NOT free: it requires a migration —
//   ALTER TABLE store_sections DROP CONSTRAINT store_sections_type_check,
//   ADD CONSTRAINT store_sections_type_check
//     CHECK (type = ANY (ARRAY['hero_banner', 'promo_carousel', 'category_grid',
//       'product_grid', 'countdown_offer', 'testimonials', 'new_type']::text[]));
// Adding a schema below for an existing type that already satisfies the CHECK
// constraint (e.g. wiring up product_grid once it has a renderer) needs no
// migration — only a new file entry here plus a renderer component.

export const heroBannerSlideSchema = z.object({
  id: z.string(),
  image_url: z.string().min(1),
  title_ar: z.string(),
  title_en: z.string(),
  subtitle_ar: z.string(),
  subtitle_en: z.string(),
  cta_label_ar: z.string(),
  cta_label_en: z.string(),
  cta_href: z.string(),
});

export const heroBannerConfigSchema = z.object({
  slides: z.array(heroBannerSlideSchema),
  autoplay_ms: z.number().int().min(0),
});

export const promoCarouselCardSchema = z.object({
  id: z.string(),
  image_url: z.string().min(1),
  title_ar: z.string(),
  title_en: z.string(),
  badge_ar: z.string().nullable(),
  badge_en: z.string().nullable(),
  discount_percent: z.number().nullable(),
  ends_at: z.string().nullable(),
  href: z.string(),
});

export const promoCarouselConfigSchema = z.object({
  heading_ar: z.string(),
  heading_en: z.string(),
  cards: z.array(promoCarouselCardSchema),
});

export const countdownOfferConfigSchema = z.object({
  title_ar: z.string(),
  title_en: z.string(),
  subtitle_ar: z.string(),
  subtitle_en: z.string(),
  ends_at: z.string(),
  href: z.string(),
  background_style: z.enum(["accent", "gradient"]),
});

export const SECTION_SCHEMAS = {
  hero_banner: heroBannerConfigSchema,
  promo_carousel: promoCarouselConfigSchema,
  countdown_offer: countdownOfferConfigSchema,
} as const;

export type SchemaSectionType = keyof typeof SECTION_SCHEMAS;

export function hasSchema(type: string): type is SchemaSectionType {
  return type in SECTION_SCHEMAS;
}

export type HeroBannerSlide = z.infer<typeof heroBannerSlideSchema>;
export type HeroBannerConfig = z.infer<typeof heroBannerConfigSchema>;
export type PromoCarouselCard = z.infer<typeof promoCarouselCardSchema>;
export type PromoCarouselConfig = z.infer<typeof promoCarouselConfigSchema>;
export type CountdownOfferConfig = z.infer<typeof countdownOfferConfigSchema>;
