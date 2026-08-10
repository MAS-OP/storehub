-- Drop the old type-matching function if it still exists (pre-dates version control)
drop function if exists public.update_section_positions(uuid, jsonb);

-- Prevent duplicate positions within a store; deferred so a multi-row swap
-- can pass through an invalid intermediate state within one transaction
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'store_sections_store_position_key'
      and conrelid = 'public.store_sections'::regclass
  ) then
    alter table public.store_sections
      add constraint store_sections_store_position_key
      unique (store_id, position)
      deferrable initially deferred;
  end if;
end $$;

-- Atomic reorder: runs as one transaction on the DB side; SECURITY INVOKER
-- so existing RLS ("Owners manage own sections") still enforces ownership.
create or replace function public.update_section_positions(
  p_store_id uuid,
  p_positions jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.store_sections as s
  set position = (p.value ->> 'position')::int,
      updated_at = now()
  from jsonb_array_elements(p_positions) as p
  where s.id = (p.value ->> 'id')::uuid
    and s.store_id = p_store_id;
end;
$$;
