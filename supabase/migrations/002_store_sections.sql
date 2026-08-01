create table if not exists public.store_sections (
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
