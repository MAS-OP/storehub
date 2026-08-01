import type { SectionType, SectionConfigMap } from "./types";

interface SectionMeta {
  label_ar: string;
  label_en: string;
  icon: string;
  defaultConfig: () => SectionConfigMap[SectionType];
}

export const SECTION_REGISTRY: Record<SectionType, SectionMeta> = {
  hero_banner: {
    label_ar: "بانر رئيسي",
    label_en: "Hero Banner",
    icon: "Image",
    defaultConfig: () => ({ slides: [], autoplay_ms: 5000 }),
  },
  promo_carousel: {
    label_ar: "عروض متحركة",
    label_en: "Promo Carousel",
    icon: "Tag",
    defaultConfig: () => ({
      heading_ar: "عروض اليوم",
      heading_en: "Today's Offers",
      cards: [],
    }),
  },
  category_grid: {
    label_ar: "شبكة الأقسام",
    label_en: "Category Grid",
    icon: "LayoutGrid",
    defaultConfig: () => ({
      heading_ar: "تسوق حسب القسم",
      heading_en: "Shop by Category",
      category_ids: [],
    }),
  },
  product_grid: {
    label_ar: "شبكة منتجات",
    label_en: "Product Grid",
    icon: "Grid3x3",
    defaultConfig: () => ({
      heading_ar: "الأكثر مبيعًا",
      heading_en: "Best Sellers",
      mode: "best_selling",
      product_ids: [],
      category_id: null,
      limit: 8,
    }),
  },
  countdown_offer: {
    label_ar: "عرض بعدّاد تنازلي",
    label_en: "Countdown Offer",
    icon: "Timer",
    defaultConfig: () => ({
      title_ar: "عرض لفترة محدودة",
      title_en: "Limited Time Offer",
      subtitle_ar: "لا تفوّت الخصم",
      subtitle_en: "Don't miss the discount",
      ends_at: new Date(Date.now() + 86400000).toISOString(),
      href: "/",
      background_style: "gradient",
    }),
  },
  testimonials: {
    label_ar: "آراء العملاء",
    label_en: "Customer Reviews",
    icon: "MessageSquareQuote",
    defaultConfig: () => ({
      heading_ar: "ماذا يقول عملاؤنا",
      heading_en: "What Our Customers Say",
      items: [],
    }),
  },
};

export const SECTION_TYPES = Object.keys(SECTION_REGISTRY) as SectionType[];
