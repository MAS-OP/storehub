-- Notifications table — schema derived directly from existing usage in:
--   app/[locale]/admin/layout.tsx (unread count)
--   app/[locale]/admin/notifications/page.tsx (list, mark-read single/all)
--   app/api/notify/route.ts (insert)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  metadata jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_store_id_idx
  on public.notifications(store_id, is_read);

alter table public.notifications enable row level security;

drop policy if exists "Owners manage own notifications" on public.notifications;
create policy "Owners manage own notifications"
  on public.notifications for all
  using (
    exists (
      select 1 from public.stores
      where stores.id = notifications.store_id
      and stores.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.stores
      where stores.id = notifications.store_id
      and stores.owner_id = auth.uid()
    )
  );
