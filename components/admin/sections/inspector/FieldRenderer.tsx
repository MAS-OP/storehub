"use client";

import { useTranslations } from "next-intl";
import { Reorder, useDragControls } from "framer-motion";
import { Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import type { FieldDescriptor } from "@/lib/sections/field-kinds";
import { createDefaultBlockItem } from "@/lib/sections/field-kinds";

type ObjRecord = Record<string, unknown>;

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-foreground/5 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(local: string): string {
  return new Date(local).toISOString();
}

type ObjectFieldsProps = {
  descriptors: FieldDescriptor[];
  value: ObjRecord;
  onChange: (next: ObjRecord) => void;
};

export function ObjectFields({ descriptors, value, onChange }: ObjectFieldsProps) {
  const t = useTranslations("admin.sections.inspector");

  function set(key: string, next: unknown) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="space-y-4">
      {descriptors.map((field) => {
        if (field.kind === "text_pair") {
          const arVal = (value[field.arKey] as string | null) ?? "";
          const enVal = (value[field.enKey] as string | null) ?? "";
          return (
            <div key={field.baseKey} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t(`fields.${field.baseKey}`)}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  dir="rtl"
                  value={arVal}
                  placeholder={t("arabic")}
                  onChange={(e) => onChange({ ...value, [field.arKey]: e.target.value })}
                  className={inputClass}
                />
                <input
                  type="text"
                  dir="ltr"
                  value={enVal}
                  placeholder={t("english")}
                  onChange={(e) => onChange({ ...value, [field.enKey]: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          );
        }

        if (field.kind === "text" || field.kind === "image" || field.kind === "link") {
          const val = (value[field.key] as string | null) ?? "";
          return (
            <div key={field.key} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t(`fields.${field.key}`)}
              </label>
              <input
                type="text"
                dir="ltr"
                value={val}
                onChange={(e) => set(field.key, e.target.value === "" && field.nullable ? null : e.target.value)}
                className={inputClass}
              />
            </div>
          );
        }

        if (field.kind === "number") {
          const val = value[field.key];
          return (
            <div key={field.key} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t(`fields.${field.key}`)}
              </label>
              <input
                type="number"
                dir="ltr"
                value={val === null || val === undefined ? "" : String(val)}
                onChange={(e) => {
                  const raw = e.target.value;
                  set(field.key, raw === "" ? (field.nullable ? null : 0) : Number(raw));
                }}
                className={inputClass}
              />
            </div>
          );
        }

        if (field.kind === "date") {
          const iso = value[field.key] as string | null | undefined;
          return (
            <div key={field.key} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t(`fields.${field.key}`)}
              </label>
              <input
                type="datetime-local"
                dir="ltr"
                value={toDatetimeLocal(iso)}
                onChange={(e) => {
                  const raw = e.target.value;
                  set(field.key, raw === "" ? (field.nullable ? null : new Date().toISOString()) : fromDatetimeLocal(raw));
                }}
                className={inputClass}
              />
            </div>
          );
        }

        if (field.kind === "select") {
          const val = (value[field.key] as string | undefined) ?? field.options[0];
          return (
            <div key={field.key} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t(`fields.${field.key}`)}
              </label>
              <select
                dir="ltr"
                value={val}
                onChange={(e) => set(field.key, e.target.value)}
                className={inputClass}
              >
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {field.key === "background_style" ? t(`backgroundStyleOptions.${opt}`) : opt}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        // field.kind === "blocks"
        const items = (value[field.key] as ObjRecord[] | undefined) ?? [];
        return (
          <BlocksField
            key={field.key}
            label={t(`fields.${field.key}`)}
            itemFields={field.itemFields}
            items={items}
            onChange={(next) => set(field.key, next)}
          />
        );
      })}
    </div>
  );
}

type BlocksFieldProps = {
  label: string;
  itemFields: FieldDescriptor[];
  items: ObjRecord[];
  onChange: (next: ObjRecord[]) => void;
};

function BlocksField({ label, itemFields, items, onChange }: BlocksFieldProps) {
  const t = useTranslations("admin.sections.inspector");

  function updateItem(index: number, next: ObjRecord) {
    const copy = [...items];
    copy[index] = next;
    onChange(copy);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function duplicateItem(index: number) {
    const copy = [...items];
    copy.splice(index + 1, 0, { ...items[index], id: crypto.randomUUID() });
    onChange(copy);
  }

  function addItem() {
    onChange([...items, createDefaultBlockItem(itemFields)]);
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>

      {items.length === 0 ? (
        <div className="glass rounded-xl p-6 text-center text-xs text-muted-foreground">
          {t("emptyBlocks")}
        </div>
      ) : (
        <Reorder.Group axis="y" values={items} onReorder={onChange} className="space-y-2">
          {items.map((item, index) => (
            <BlockItemRow
              key={(item.id as string | undefined) ?? index}
              item={item}
              itemFields={itemFields}
              onChange={(next) => updateItem(index, next)}
              onRemove={() => removeItem(index)}
              onDuplicate={() => duplicateItem(index)}
            />
          ))}
        </Reorder.Group>
      )}

      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        {t("addBlock")}
      </button>
    </div>
  );
}

type BlockItemRowProps = {
  item: ObjRecord;
  itemFields: FieldDescriptor[];
  onChange: (next: ObjRecord) => void;
  onRemove: () => void;
  onDuplicate: () => void;
};

function BlockItemRow({ item, itemFields, onChange, onRemove, onDuplicate }: BlockItemRowProps) {
  const t = useTranslations("admin.sections.inspector");
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className="rounded-xl border border-border bg-foreground/5 p-3 space-y-3"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground transition-colors touch-none"
          aria-label={t("dragToReorder")}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onDuplicate}
          className="p-1.5 rounded-lg hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={t("duplicateBlock")}
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
          aria-label={t("removeBlock")}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <ObjectFields descriptors={itemFields} value={item} onChange={onChange} />
    </Reorder.Item>
  );
}
