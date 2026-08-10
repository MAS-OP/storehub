import { z } from "zod";

// Derives a form field descriptor list from a Zod object schema so the
// inspector UI can render itself instead of hand-writing one form per
// section type. Field "kind" is inferred from the Zod type plus a small set
// of key-name conventions already used throughout lib/sections/schemas.ts
// (`*_ar`/`*_en` pairs, `*_url`, `*_href`/`href`, `*_at`/`ends_at`).

export type FieldDescriptor =
  | { kind: "text_pair"; baseKey: string; arKey: string; enKey: string; nullable: boolean }
  | { kind: "text"; key: string; nullable: boolean }
  | { kind: "image"; key: string; nullable: boolean }
  | { kind: "link"; key: string; nullable: boolean }
  | { kind: "number"; key: string; nullable: boolean }
  | { kind: "date"; key: string; nullable: boolean }
  | { kind: "select"; key: string; options: string[]; nullable: boolean }
  | { kind: "blocks"; key: string; itemFields: FieldDescriptor[] };

function unwrapNullable(schema: z.ZodTypeAny): { inner: z.ZodTypeAny; nullable: boolean } {
  if (schema instanceof z.ZodNullable) {
    return { inner: schema.unwrap(), nullable: true };
  }
  return { inner: schema, nullable: false };
}

function describePrimitive(key: string, schema: z.ZodTypeAny): FieldDescriptor {
  const { inner, nullable } = unwrapNullable(schema);

  if (inner instanceof z.ZodEnum) {
    return { kind: "select", key, options: [...inner.options] as string[], nullable };
  }
  if (inner instanceof z.ZodNumber) {
    return { kind: "number", key, nullable };
  }
  if (key === "ends_at" || key.endsWith("_at")) {
    return { kind: "date", key, nullable };
  }
  if (key.endsWith("_url")) {
    return { kind: "image", key, nullable };
  }
  if (key === "href" || key.endsWith("_href")) {
    return { kind: "link", key, nullable };
  }
  return { kind: "text", key, nullable };
}

export function deriveFieldDescriptors(objectSchema: z.AnyZodObject): FieldDescriptor[] {
  const shape = objectSchema.shape as Record<string, z.ZodTypeAny>;
  const keys = Object.keys(shape).filter((key) => key !== "id");
  const consumed = new Set<string>();
  const descriptors: FieldDescriptor[] = [];

  for (const key of keys) {
    if (consumed.has(key)) continue;
    const fieldSchema = shape[key];

    if (key.endsWith("_ar")) {
      const baseKey = key.slice(0, -3);
      const enKey = `${baseKey}_en`;
      if (shape[enKey]) {
        const { nullable } = unwrapNullable(fieldSchema);
        descriptors.push({ kind: "text_pair", baseKey, arKey: key, enKey, nullable });
        consumed.add(enKey);
        continue;
      }
    }

    const { inner } = unwrapNullable(fieldSchema);
    if (inner instanceof z.ZodArray) {
      const element = inner.element as z.ZodTypeAny;
      if (element instanceof z.ZodObject) {
        descriptors.push({ kind: "blocks", key, itemFields: deriveFieldDescriptors(element) });
        continue;
      }
    }

    descriptors.push(describePrimitive(key, fieldSchema));
  }

  return descriptors;
}

export function createDefaultBlockItem(itemFields: FieldDescriptor[]): Record<string, unknown> {
  const item: Record<string, unknown> = { id: crypto.randomUUID() };

  for (const field of itemFields) {
    switch (field.kind) {
      case "text_pair":
        item[field.arKey] = field.nullable ? null : "";
        item[field.enKey] = field.nullable ? null : "";
        break;
      case "text":
      case "image":
      case "link":
        item[field.key] = field.nullable ? null : "";
        break;
      case "date":
        item[field.key] = field.nullable ? null : new Date(Date.now() + 86_400_000).toISOString();
        break;
      case "number":
        item[field.key] = field.nullable ? null : 0;
        break;
      case "select":
        item[field.key] = field.options[0] ?? "";
        break;
      case "blocks":
        item[field.key] = [];
        break;
    }
  }

  return item;
}
