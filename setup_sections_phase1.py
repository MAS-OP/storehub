#!/usr/bin/env python3
import os

def write_file(path: str, content: str) -> None:
    d = os.path.dirname(path)
    if d:
        os.makedirs(d, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"OK wrote: {path}")

# ── 1) SQL migration ─────────────────────────────────────────────
write_file("supabase/migrations/002_store_sections.sql", """create table if not exists public.store_sections (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  type text not null check (type in (
    'hero_banner', 'promo_carousel', 'category_grid',
    'product_grid', 'countdown_offer', 'testimonials'
  )),
  config jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists store_sections_store_id_idx
  on public.store_sections(store_id, position);

alter table public.store_sections enable row level security;

drop policy if exists "Public can view active sections" on public.store_sections;
create policy "Public can view active sections"
  on public.store_sections for select
  using (
    is_active = true
    and exists (
      select 1 from public.stores
      where stores.id = store_sections.store_id
      and stores.is_active = true
    )
  );

drop policy if exists "Owners manage own sections" on public.store_sections;
create policy "Owners manage own sections"
  on public.store_sections for all
  using (
    exists (
      select 1 from public.stores
      where stores.id = store_sections.store_id
      and stores.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.stores
      where stores.id = store_sections.store_id
      and stores.owner_id = auth.uid()
    )
  );

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists store_sections_updated_at on public.store_sections;
create trigger store_sections_updated_at
  before update on public.store_sections
  for each row execute function public.set_updated_at();
""")

# ── 2) lib/sections/types.ts ─────────────────────────────────────
write_file("lib/sections/types.ts", """export type SectionType =
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
""")

# ── 3) lib/sections/registry.ts ──────────────────────────────────
write_file("lib/sections/registry.ts", """import type { SectionType, SectionConfigMap } from "./types";

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
""")

# ── 4) lib/sections/queries.ts ───────────────────────────────────
write_file("lib/sections/queries.ts", """import { createClient } from "@/supabase/client";
import type { StoreSection, SectionType, SectionConfigMap } from "./types";

export async function getPublicSections(storeId: string): Promise<StoreSection[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("store_sections")
    .select("*")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .order("position", { ascending: true });

  if (error) throw error;
  return (data ?? []) as StoreSection[];
}

export async function getOwnerSections(storeId: string): Promise<StoreSection[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("store_sections")
    .select("*")
    .eq("store_id", storeId)
    .order("position", { ascending: true });

  if (error) throw error;
  return (data ?? []) as StoreSection[];
}

export async function createSection<T extends SectionType>(
  storeId: string,
  type: T,
  config: SectionConfigMap[T],
  position: number
): Promise<StoreSection<T>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("store_sections")
    .insert({ store_id: storeId, type, config, position, is_active: true })
    .select()
    .single();

  if (error) throw error;
  return data as StoreSection<T>;
}

export async function updateSectionConfig<T extends SectionType>(
  id: string,
  config: SectionConfigMap[T]
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("store_sections").update({ config }).eq("id", id);
  if (error) throw error;
}

export async function toggleSectionActive(id: string, isActive: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("store_sections")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteSection(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("store_sections").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderSections(
  updates: { id: string; position: number }[]
): Promise<void> {
  const supabase = createClient();
  await Promise.all(
    updates.map(({ id, position }) =>
      supabase.from("store_sections").update({ position }).eq("id", id)
    )
  );
}
""")

# ── 5) Patch supabase/types.ts (idempotent) ──────────────────────
types_path = "supabase/types.ts"
anchor = """      analytics_events: {
        Row: {
          id: string;
          store_id: string;
          event_type: string;
          product_id: string | null;
          order_id: string | null;
          value: number | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["analytics_events"]["Row"],
          "id" | "created_at"
        >;
        Update: never;
      };
    };"""

insertion = """      analytics_events: {
        Row: {
          id: string;
          store_id: string;
          event_type: string;
          product_id: string | null;
          order_id: string | null;
          value: number | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["analytics_events"]["Row"],
          "id" | "created_at"
        >;
        Update: never;
      };
      store_sections: {
        Row: {
          id: string;
          store_id: string;
          type:
            | "hero_banner"
            | "promo_carousel"
            | "category_grid"
            | "product_grid"
            | "countdown_offer"
            | "testimonials";
          config: Json;
          position: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["store_sections"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["store_sections"]["Insert"]
        >;
      };
    };"""

if not os.path.exists(types_path):
    print(f"MISSING: {types_path} -- run this from the storehub project root")
else:
    with open(types_path, "r", encoding="utf-8") as f:
        current = f.read()
    if "store_sections:" in current:
        print(f"SKIP: {types_path} already patched")
    elif anchor in current:
        with open(types_path, "w", encoding="utf-8") as f:
            f.write(current.replace(anchor, insertion, 1))
        print(f"OK patched: {types_path}")
    else:
        print(f"WARN: could not find insertion anchor in {types_path}")
        print("Add this block manually inside Tables, right after analytics_events:")
        print(insertion)

print("")
print("=== Next steps ===")
print("1) pnpm add embla-carousel-react")
print("2) Open Supabase Dashboard -> SQL Editor, paste supabase/migrations/002_store_sections.sql, click Run")
print("3) pnpm tsc --noEmit")
