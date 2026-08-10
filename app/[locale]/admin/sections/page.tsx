import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { getOwnerSectionsServer } from "@/lib/sections/queries.server";
import { SectionsEditorShell } from "@/components/sections/SectionsEditorShell";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SectionsPage({ params }: Props) {
  const { locale } = await params;
  const isAr = locale === "ar";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!store) redirect(`/${locale}/create`);

  const sections = await getOwnerSectionsServer(store.id);

  return (
    <div className="p-6 md:p-8 max-w-6xl" dir={isAr ? "rtl" : "ltr"}>
      <h1 className="text-2xl font-black text-foreground mb-2">
        {isAr ? "أقسام المتجر" : "Store sections"}
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        {isAr
          ? "رتّب أقسام واجهة متجرك بالسحب والإفلات، وفعّل أو عطّل أي قسم"
          : "Drag to reorder your storefront sections, and toggle each one on or off"}
      </p>

      <SectionsEditorShell storeId={store.id} initialSections={sections} isAr={isAr} />
    </div>
  );
}
