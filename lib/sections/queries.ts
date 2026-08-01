import { createClient } from "@/supabase/client";
import type { Json } from "@/supabase/types";
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
  return (data ?? []) as unknown as StoreSection[];
}

export async function getOwnerSections(storeId: string): Promise<StoreSection[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("store_sections")
    .select("*")
    .eq("store_id", storeId)
    .order("position", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as StoreSection[];
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
    .insert({
      store_id: storeId,
      type,
      config: config as unknown as Json,
      position,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as unknown as StoreSection<T>;
}

export async function updateSectionConfig<T extends SectionType>(
  id: string,
  config: SectionConfigMap[T]
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("store_sections")
    .update({ config: config as unknown as Json })
    .eq("id", id);
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
