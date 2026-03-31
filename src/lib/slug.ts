import { z } from "zod";

const uuidSchema = z.string().uuid();

export function slugifyName(value: string, maxLength = 64) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, maxLength)
    .replace(/-+$/g, "");

  return slug || "item";
}

export async function generateScopedSlug(
  baseName: string,
  exists: (slug: string) => Promise<boolean>,
  maxLength = 64
) {
  const baseSlug = slugifyName(baseName, maxLength);
  let candidate = baseSlug;
  let suffix = 2;

  while (await exists(candidate)) {
    candidate = `${baseSlug}-${suffix}`;
    if (candidate.length > maxLength) {
      candidate = `${baseSlug.slice(
        0,
        Math.max(1, maxLength - String(suffix).length - 1)
      )}-${suffix}`;
    }
    suffix += 1;
  }

  return candidate;
}

export function isUuid(value: string) {
  return uuidSchema.safeParse(value).success;
}

export const routeIdentifierSchema = z
  .string()
  .trim()
  .min(1, "Identifier is required")
  .max(128, "Identifier is too long")
  .regex(/^[a-zA-Z0-9-]+$/, "Invalid identifier");
