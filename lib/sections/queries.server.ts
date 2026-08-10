import { createClient } from "@/supabase/server";
import type { StoreSection } from "./types";

export async function getOwnerSectionsServer(storeId: string): Promise<StoreSection[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_sections")
    .select("*")
    .eq("store_id", storeId)
    .order("position", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as StoreSection[];
}
