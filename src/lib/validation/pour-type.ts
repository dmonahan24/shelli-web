import { z } from "zod";
import {
  pourCategoryValues,
  pourTypePresetBundleValues,
  pourTypeStatusValues,
} from "@/lib/hierarchy";

const concreteSchema = z.coerce
  .number({ invalid_type_error: "Enter a valid concrete value" })
  .min(0, "Value must be 0 or greater");

const displayOrderSchema = z.coerce
  .number({ invalid_type_error: "Enter a valid display order" })
  .int("Display order must be a whole number")
  .min(0, "Display order must be 0 or greater")
  .max(100000, "Display order is too large");

export const pourCategorySchema = z.enum(pourCategoryValues);
export const pourTypeStatusSchema = z.enum(pourTypeStatusValues);

export const pourTypeFormSchema = z.object({
  name: z.string().trim().min(1, "Pour type name is required").max(120),
  pourCategory: pourCategorySchema.default("other"),
  estimatedConcrete: concreteSchema,
  actualConcrete: concreteSchema.default(0),
  status: pourTypeStatusSchema.default("not_started"),
  notes: z
    .string()
    .trim()
    .max(2000, "Notes must be 2000 characters or fewer")
    .optional()
    .or(z.literal("")),
  displayOrder: displayOrderSchema.optional(),
});

export const createPourTypeSchema = pourTypeFormSchema.extend({
  floorId: z.string().uuid("Invalid floor id"),
});

export const updatePourTypeSchema = pourTypeFormSchema.extend({
  pourTypeId: z.string().uuid("Invalid pour type id"),
});

export const deletePourTypeSchema = z.object({
  pourTypeId: z.string().uuid("Invalid pour type id"),
});

export const applyPourTypePresetBundleSchema = z.object({
  floorId: z.string().uuid("Invalid floor id"),
  bundle: z.enum(pourTypePresetBundleValues),
});

export type PourTypeFormInput = z.input<typeof pourTypeFormSchema>;
export type CreatePourTypeInput = z.input<typeof createPourTypeSchema>;
export type UpdatePourTypeInput = z.input<typeof updatePourTypeSchema>;
export type ApplyPourTypePresetBundleInput = z.input<typeof applyPourTypePresetBundleSchema>;
