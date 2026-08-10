// hero_banner, promo_carousel, and countdown_offer config shapes are defined
// once, in schemas.ts (Zod), and re-exported here — see lib/sections/schemas.ts.
// category_grid, product_grid, and testimonials have no renderer yet, so they
// stay hand-written until a schema is added for them.
import type {
  HeroBannerSlide,
  HeroBannerConfig,
  PromoCarouselCard,
  PromoCarouselConfig,
  CountdownOfferConfig,
} from "./schemas";

export type {
  HeroBannerSlide,
  HeroBannerConfig,
  PromoCarouselCard,
  PromoCarouselConfig,
  CountdownOfferConfig,
};

export type SectionType =
  | "hero_banner"
  | "promo_carousel"
  | "category_grid"
  | "product_grid"
  | "countdown_offer"
  | "testimonials";

export interface CategoryGridConfig {
  heading_ar: string;
  heading_en: string;
  category_ids: string[];
}

export interface ProductGridConfig {
  heading_ar: string;
  heading_en: string;
  mode: "manual" | "best_selling" | "new_arrivals" | "category";
  product_ids: string[];
  category_id: string | null;
  limit: number;
}

export interface TestimonialItem {
  id: string;
  author_name: string;
  rating: number;
  quote_ar: string;
  quote_en: string;
}

export interface TestimonialsConfig {
  heading_ar: string;
  heading_en: string;
  items: TestimonialItem[];
}

export type SectionConfigMap = {
  hero_banner: HeroBannerConfig;
  promo_carousel: PromoCarouselConfig;
  category_grid: CategoryGridConfig;
  product_grid: ProductGridConfig;
  countdown_offer: CountdownOfferConfig;
  testimonials: TestimonialsConfig;
};

export interface StoreSection<T extends SectionType = SectionType> {
  id: string;
  store_id: string;
  type: T;
  config: SectionConfigMap[T];
  position: number;
  is_active: boolean;
}
