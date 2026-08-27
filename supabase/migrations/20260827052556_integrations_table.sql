-- Integrations table — schema confirmed directly from
-- app/[locale]/admin/integrations/page.tsx (select, and upsert with
-- explicit onConflict: "store_id,type", which fixes the unique constraint).
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  type text not null,
  name text not null,
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, type)
);

create index if not exists integrations_store_id_idx
  on public.integrations(store_id);

alter table public.integrations enable row level security;

drop policy if exists "Owners manage own integrations" on public.integrations;
create policy "Owners manage own integrations"
  on public.integrations for all
  using (
    exists (
      select 1 from public.stores
      where stores.id = integrations.store_id
      and stores.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.stores
      where stores.id = integrations.store_id
      and stores.owner_id = auth.uid()
    )
  );

drop trigger if exists integrations_updated_at on public.integrations;
create trigger integrations_updated_at
  before update on public.integrations
  for each row execute function public.set_updated_at();
