-- Allow-list of platform operators (superadmins), fully separate from stores.owner_id
create table if not exists public.platform_admins (
  id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from anon, authenticated;

create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.platform_admins
    where id = auth.uid()
      and is_active = true
  );
$$;

grant execute on function public.is_platform_admin() to authenticated;
