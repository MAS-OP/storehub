-- Pin search_path on updated_at trigger functions (defense against search_path hijacking).
-- Reconstructed from live pg_get_functiondef output — verified to match exactly.
alter function public.update_updated_at() set search_path = '';
alter function public.set_updated_at() set search_path = '';
