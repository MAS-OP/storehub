import { createClient } from "@/supabase/server";
import { notFound } from "next/navigation";

type Props = {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
};

export default async function StoreLayout({ children, params }: Props) {
  const { subdomain } = await params;
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id, primary_color, is_active")
    .eq("subdomain", subdomain)
    .single();

  if (!store || !store.is_active) notFound();

  return (
    <div
      className="store-theme min-h-screen"
      style={{ "--store-primary": store.primary_color } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
