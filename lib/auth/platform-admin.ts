import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";

export async function requirePlatformAdmin(): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: isAdmin, error } = await supabase.rpc("is_platform_admin");

  if (error || !isAdmin) {
    redirect("/");
  }

  // MFA (AAL2) intentionally not enforced yet — no enrollment UI exists,
  // and this account has no factors. Add once a real /platform-admin/login
  // + mfa-challenge flow exists.
}
