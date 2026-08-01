#!/usr/bin/env python3
import os

def read_file(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def write_file(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"OK wrote: {path}")

# ── 1) Fix supabase/types.ts: add missing Relationships field ────
types_path = "supabase/types.ts"
if not os.path.exists(types_path):
    print(f"MISSING: {types_path} -- run this from the storehub project root")
else:
    content = read_file(types_path)
    if "Relationships: []" in content:
        print(f"SKIP: {types_path} already has Relationships fields")
    else:
        pattern = "        };\n        Insert: Omit<"
        replacement = "        };\n        Relationships: [];\n        Insert: Omit<"
        count = content.count(pattern)
        if count == 0:
            print(f"WARN: could not find table pattern to patch in {types_path}")
            print("Add 'Relationships: [];' manually right after each table's closing")
            print("Row `};` and before its `Insert:` line.")
        else:
            content = content.replace(pattern, replacement)
            write_file(types_path, content)
            print(f"OK patched {count} table(s) with Relationships: [] in {types_path}")

# ── 2) Fix lib/sections/queries.ts: correct Json casts ───────────
write_file("lib/sections/queries.ts", """import { createClient } from "@/supabase/client";
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
""")

print("")
print("=== Next ===")
print("pnpm tsc --noEmit")
print("lib/sections/queries.ts should now show 0 errors.")
print("Compare the new TOTAL error count with the previous 218 -- send it back.")
