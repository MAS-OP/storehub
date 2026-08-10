"use client";

import { useState } from "react";
import { SectionsDragEditor } from "@/components/sections/SectionsDragEditor";
import { SectionInspector } from "@/components/admin/sections/inspector/SectionInspector";
import type { StoreSection } from "@/lib/sections/types";

type Props = {
  storeId: string;
  initialSections: StoreSection[];
  isAr: boolean;
};

export function SectionsEditorShell({ storeId, initialSections, isAr }: Props) {
  const [selected, setSelected] = useState<StoreSection | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <SectionsDragEditor
        storeId={storeId}
        initialSections={initialSections}
        isAr={isAr}
        selectedId={selected?.id ?? null}
        onSelect={setSelected}
      />
      <SectionInspector
        section={selected}
        isAr={isAr}
        onClose={() => setSelected(null)}
        onSaved={setSelected}
      />
    </div>
  );
}
