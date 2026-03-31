import { z } from "zod";
import { floorTypeValues } from "@/lib/hierarchy";

const displayOrderSchema = z.coerce
  .number({ invalid_type_error: "Enter a valid display order" })
  .int("Display order must be a whole number")
  .min(0, "Display order must be 0 or greater")
  .max(100000, "Display order is too large");

const levelNumberSchema = z.coerce
  .number({ invalid_type_error: "Enter a valid level number" })
  .int("Level number must be a whole number")
  .positive("Level number must be greater than 0");

export const floorTypeSchema = z.enum(floorTypeValues);

const floorFormObjectSchema = z.object({
  floorType: floorTypeSchema,
  levelNumber: levelNumberSchema.optional(),
  customName: z
    .string()
    .trim()
    .max(120, "Custom floor name must be 120 characters or fewer")
    .optional()
    .or(z.literal("")),
  displayOrder: displayOrderSchema.optional(),
});

function validateFloorShape(
  value: z.infer<typeof floorFormObjectSchema>,
  ctx: z.RefinementCtx
) {
  if (value.floorType === "standard" && !value.levelNumber) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["levelNumber"],
      message: "Level number is required for standard floors.",
    });
  }

  if (value.floorType !== "standard" && value.levelNumber !== undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["levelNumber"],
      message: "Level number is only used for standard floors.",
    });
  }
}

export const floorFormSchema = floorFormObjectSchema.superRefine(validateFloorShape);

export const createFloorSchema = floorFormObjectSchema
  .extend({
    buildingId: z.string().uuid("Invalid building id"),
  })
  .superRefine(validateFloorShape);

export const updateFloorSchema = floorFormObjectSchema
  .extend({
    floorId: z.string().uuid("Invalid floor id"),
  })
  .superRefine(validateFloorShape);

export const deleteFloorSchema = z.object({
  floorId: z.string().uuid("Invalid floor id"),
});

export const bulkCreateFloorsSchema = z.object({
  buildingId: z.string().uuid("Invalid building id"),
  includeFoundation: z.boolean().default(false),
  includeGroundLevel: z.boolean().default(false),
  topStandardLevel: levelNumberSchema.optional(),
});

export type FloorFormInput = z.input<typeof floorFormSchema>;
export type CreateFloorInput = z.input<typeof createFloorSchema>;
export type UpdateFloorInput = z.input<typeof updateFloorSchema>;
export type BulkCreateFloorsInput = z.input<typeof bulkCreateFloorsSchema>;
