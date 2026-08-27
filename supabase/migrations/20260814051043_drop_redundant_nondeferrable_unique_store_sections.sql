-- The original redundant non-deferrable UNIQUE(store_id, position) constraint
-- wasn't created by 001/002/003 — it was added outside the migration system,
-- so its exact original name is unrecoverable. This finds it by column
-- signature instead of a guessed name, and drops it if still present.
-- Safe/idempotent: currently a no-op, since the constraint is already gone.
do $$
declare
  v_conname text;
begin
  select con.conname into v_conname
  from pg_constraint con
  where con.conrelid = 'public.store_sections'::regclass
    and con.contype = 'u'
    and con.condeferrable = false
    and con.conname <> 'store_sections_store_position_key'
    and (
      select array_agg(a.attname order by a.attname)
      from unnest(con.conkey) as k(attnum)
      join pg_attribute a
        on a.attrelid = con.conrelid and a.attnum = k.attnum
    ) = array['position', 'store_id'];

  if v_conname is not null then
    execute format('alter table public.store_sections drop constraint %I', v_conname);
  end if;
end $$;
