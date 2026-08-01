export type SectionType =
  | "hero_banner"
  | "promo_carousel"
  | "category_grid"
  | "product_grid"
  | "countdown_offer"
  | "testimonials";

export interface HeroBannerSlide {
  id: string;
  image_url: string;
  title_ar: string;
  title_en: string;
  subtitle_ar: string;
  subtitle_en: string;
  cta_label_ar: string;
  cta_label_en: string;
  cta_href: string;
}

export interface HeroBannerConfig {
  slides: HeroBannerSlide[];
  autoplay_ms: number;
}

export interface PromoCarouselCard {
  id: string;
  image_url: string;
  title_ar: string;
  title_en: string;
  badge_ar: string | null;
  badge_en: string | null;
  discount_percent: number | null;
  ends_at: string | null;
  href: string;
}

export interface PromoCarouselConfig {
  heading_ar: string;
  heading_en: string;
  cards: PromoCarouselCard[];
}

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

export interface CountdownOfferConfig {
  title_ar: string;
  title_en: string;
  subtitle_ar: string;
  subtitle_en: string;
  ends_at: string;
  href: string;
  background_style: "accent" | "gradient";
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
