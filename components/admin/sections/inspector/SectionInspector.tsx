"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { SECTION_SCHEMAS, hasSchema } from "@/lib/sections/schemas";
import { deriveFieldDescriptors } from "@/lib/sections/field-kinds";
import { saveSectionConfig } from "@/lib/sections/actions";
import { SECTION_REGISTRY } from "@/lib/sections/registry";
import type { StoreSection } from "@/lib/sections/types";
import { ObjectFields } from "./FieldRenderer";

type Props = {
  section: StoreSection | null;
  isAr: boolean;
  onClose: () => void;
  onSaved: (section: StoreSection) => void;
};

export function SectionInspector({ section, isAr, onClose, onSaved }: Props) {
  const t = useTranslations("admin.sections.inspector");
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setDraft(section ? (section.config as unknown as Record<string, unknown>) : null);
    setError(null);
    setSavedAt(null);
  }, [section?.id]);

  if (!section) {
    return (
      <div
        className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground"
        dir={isAr ? "rtl" : "ltr"}
      >
        {t("selectSection")}
      </div>
    );
  }

  const sectionType = section.type;

  if (!hasSchema(sectionType) || !draft) {
    return (
      <div
        className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground"
        dir={isAr ? "rtl" : "ltr"}
      >
        {t("noSchemaYet")}
      </div>
    );
  }

  const schema = SECTION_SCHEMAS[sectionType];
  const descriptors = deriveFieldDescriptors(schema);
  const meta = SECTION_REGISTRY[sectionType];
  const label = isAr ? meta.label_ar : meta.label_en;
  const sectionId = section.id;

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    setSavedAt(null);
    const result = await saveSectionConfig(sectionId, sectionType, draft);
    setSaving(false);
    if (result.ok) {
      setDraft(result.section.config as unknown as Record<string, unknown>);
      setSavedAt(Date.now());
      onSaved(result.section);
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="glass rounded-2xl p-5 space-y-4" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-foreground">
          {t("editSection")} — {label}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={t("close")}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      <ObjectFields descriptors={descriptors} value={draft} onChange={setDraft} />

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-accent-foreground font-semibold text-sm glow-brand hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? t("saving") : t("save")}
        </button>
        {savedAt && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t("saved")}
          </span>
        )}
      </div>
    </div>
  );
}
