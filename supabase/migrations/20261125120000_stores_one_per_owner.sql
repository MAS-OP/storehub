alter table public.stores
  add constraint stores_owner_id_key unique (owner_id);
