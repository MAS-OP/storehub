"use server";

import { createClient } from "@/supabase/server";
import { SECTION_SCHEMAS, hasSchema } from "./schemas";
import { toJson } from "./json";
import type { SectionType, StoreSection } from "./types";

export type SaveSectionConfigResult =
  | { ok: true; section: StoreSection }
  | { ok: false; error: string };

// Server action: validates config against the Zod schema resolved from the
// section's actual DB type before writing, so a tampered or stale client
// payload can never reach the row unvalidated.
export async function saveSectionConfig(
  sectionId: string,
  type: SectionType,
  config: unknown
): Promise<SaveSectionConfigResult> {
  if (!hasSchema(type)) {
    return { ok: false, error: `No schema registered for section type "${type}"` };
  }

  const parsed = SECTION_SCHEMAS[type].safeParse(config);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((issue) => issue.message).join("; ") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("store_sections")
    .update({ config: toJson(parsed.data) })
    .eq("id", sectionId)
    .eq("type", type)
    .select()
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data) {
    return { ok: false, error: "Section not found or not owned by current user" };
  }

  return { ok: true, section: data as unknown as StoreSection };
}
