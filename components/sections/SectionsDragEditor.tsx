"use client";

import { useEffect, useRef, useState } from "react";
import { Reorder, useDragControls, type PanInfo } from "framer-motion";
import {
  GripVertical,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Pencil,
  AlertCircle,
  X,
  Loader2,
  Image,
  Tag,
  LayoutGrid,
  Grid3x3,
  Timer,
  MessageSquareQuote,
  type LucideIcon,
} from "lucide-react";
import { SECTION_REGISTRY, SECTION_TYPES } from "@/lib/sections/registry";
import {
  createSection,
  deleteSection,
  reorderSections,
  toggleSectionActive,
} from "@/lib/sections/queries";
import type { SectionType, StoreSection } from "@/lib/sections/types";

const SECTION_ICONS: Record<string, LucideIcon> = {
  Image,
  Tag,
  LayoutGrid,
  Grid3x3,
  Timer,
  MessageSquareQuote,
};

type Props = {
  storeId: string;
  initialSections: StoreSection[];
  isAr: boolean;
  selectedId?: string | null;
  onSelect?: (section: StoreSection | null) => void;
};

export function SectionsDragEditor({
  storeId,
  initialSections,
  isAr,
  selectedId = null,
  onSelect,
}: Props) {
  const [sections, setSections] = useState<StoreSection[]>(initialSections);
  const [error, setError] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addingType, setAddingType] = useState<SectionType | null>(null);

  const sectionsRef = useRef(sections);
  const lastSavedOrderRef = useRef(initialSections);

  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);

  async function handleDragEnd() {
    const current = sectionsRef.current;
    setSavingOrder(true);
    setError(null);
    const result = await reorderSections(
      storeId,
      current.map((s, i) => ({ id: s.id, position: i }))
    );
    if (result.ok) {
      const updated = current.map((s, i) => ({ ...s, position: i }));
      lastSavedOrderRef.current = updated;
      setSections(updated);
    } else {
      setSections(lastSavedOrderRef.current);
      setError(isAr ? "تعذر حفظ الترتيب، تمت استعادة الترتيب السابق" : "Failed to save order, reverted");
    }
    setSavingOrder(false);
  }

  async function handleToggle(section: StoreSection) {
    const prev = sections;
    setBusyId(section.id);
    setError(null);
    setSections((s) =>
      s.map((x) => (x.id === section.id ? { ...x, is_active: !x.is_active } : x))
    );
    try {
      await toggleSectionActive(section.id, !section.is_active);
      lastSavedOrderRef.current = lastSavedOrderRef.current.map((x) =>
        x.id === section.id ? { ...x, is_active: !section.is_active } : x
      );
    } catch {
      setSections(prev);
      setError(isAr ? "تعذر تحديث حالة القسم" : "Failed to update section status");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(section: StoreSection) {
    const prev = sections;
    setBusyId(section.id);
    setConfirmDeleteId(null);
    setError(null);
    setSections((s) => s.filter((x) => x.id !== section.id));
    try {
      await deleteSection(section.id);
      lastSavedOrderRef.current = lastSavedOrderRef.current.filter((x) => x.id !== section.id);
      if (section.id === selectedId) {
        onSelect?.(null);
      }
    } catch {
      setSections(prev);
      setError(isAr ? "تعذر حذف القسم" : "Failed to delete section");
    } finally {
      setBusyId(null);
    }
  }

  async function handleAdd(type: SectionType) {
    setAddingType(type);
    setError(null);
    try {
      const created = await createSection(
        storeId,
        type,
        SECTION_REGISTRY[type].defaultConfig(),
        sections.length
      );
      setSections((s) => {
        const next = [...s, created];
        lastSavedOrderRef.current = next;
        return next;
      });
      setAddOpen(false);
    } catch {
      setError(isAr ? "تعذر إضافة القسم" : "Failed to add section");
    } finally {
      setAddingType(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-400 hover:text-foreground transition-colors"
            aria-label={isAr ? "إغلاق" : "Dismiss"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {sections.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center text-muted-foreground text-sm">
          {isAr ? "لا توجد أقسام بعد" : "No sections yet"}
        </div>
      ) : (
        <Reorder.Group axis="y" values={sections} onReorder={setSections} className="space-y-2">
          {sections.map((section) => (
            <SectionRow
              key={section.id}
              section={section}
              isAr={isAr}
              busy={busyId === section.id}
              selected={selectedId === section.id}
              confirmingDelete={confirmDeleteId === section.id}
              onToggle={handleToggle}
              onSelect={onSelect}
              onRequestDelete={(id) => setConfirmDeleteId(id)}
              onConfirmDelete={handleDelete}
              onCancelDelete={() => setConfirmDeleteId(null)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </Reorder.Group>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setAddOpen((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-accent-foreground font-semibold text-sm glow-brand hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          {isAr ? "إضافة قسم" : "Add section"}
        </button>

        {addOpen && (
          <div className="mt-2 glass rounded-2xl p-2 grid grid-cols-2 gap-1 max-w-md">
            {SECTION_TYPES.map((type) => {
              const meta = SECTION_REGISTRY[type];
              const Icon = SECTION_ICONS[meta.icon] ?? LayoutGrid;
              const busy = addingType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleAdd(type)}
                  disabled={addingType !== null}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-foreground/5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 text-start"
                >
                  {busy ? (
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                  ) : (
                    <Icon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  )}
                  <span className="truncate">{isAr ? meta.label_ar : meta.label_en}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {savingOrder && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin" />
          {isAr ? "جارٍ حفظ الترتيب..." : "Saving order..."}
        </p>
      )}
    </div>
  );
}

type RowProps = {
  section: StoreSection;
  isAr: boolean;
  busy: boolean;
  selected: boolean;
  confirmingDelete: boolean;
  onToggle: (section: StoreSection) => void;
  onSelect?: (section: StoreSection | null) => void;
  onRequestDelete: (id: string) => void;
  onConfirmDelete: (section: StoreSection) => void;
  onCancelDelete: () => void;
  onDragEnd: (event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => void;
};

function SectionRow({
  section,
  isAr,
  busy,
  selected,
  confirmingDelete,
  onToggle,
  onSelect,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
  onDragEnd,
}: RowProps) {
  const dragControls = useDragControls();
  const meta = SECTION_REGISTRY[section.type];
  const Icon = SECTION_ICONS[meta.icon] ?? LayoutGrid;
  const label = isAr ? meta.label_ar : meta.label_en;

  return (
    <Reorder.Item
      value={section}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-foreground/5 border transition-colors ${
        selected ? "border-primary ring-1 ring-primary/40" : "border-border"
      }`}
    >
      <button
        type="button"
        onPointerDown={(e) => dragControls.start(e)}
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground transition-colors touch-none"
        aria-label={isAr ? "سحب لإعادة الترتيب" : "Drag to reorder"}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="w-9 h-9 rounded-lg bg-foreground/5 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-indigo-400" />
      </div>

      <span className="flex-1 text-sm text-foreground truncate">{label}</span>

      {!section.is_active && (
        <span className="px-2 py-0.5 rounded-full text-xs bg-foreground/5 text-muted-foreground border border-border">
          {isAr ? "معطّل" : "Disabled"}
        </span>
      )}

      <button
        type="button"
        onClick={() => onSelect?.(selected ? null : section)}
        className={`p-1.5 rounded-lg hover:bg-foreground/5 transition-colors ${
          selected ? "text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label={isAr ? "تعديل القسم" : "Edit section"}
      >
        <Pencil className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => onToggle(section)}
        disabled={busy}
        className="p-1.5 rounded-lg hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        aria-label={isAr ? "تبديل التفعيل" : "Toggle active"}
      >
        {section.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>

      {confirmingDelete ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onConfirmDelete(section)}
            disabled={busy}
            className="px-2 py-1 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isAr ? "تأكيد" : "Confirm"}
          </button>
          <button
            type="button"
            onClick={onCancelDelete}
            className="px-2 py-1 rounded-lg glass text-muted-foreground text-xs hover:bg-foreground/5 transition-colors"
          >
            {isAr ? "إلغاء" : "Cancel"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onRequestDelete(section.id)}
          disabled={busy}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50"
          aria-label={isAr ? "حذف" : "Delete"}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </Reorder.Item>
  );
}
