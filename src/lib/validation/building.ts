import { z } from "zod";

const displayOrderSchema = z.coerce
  .number({ invalid_type_error: "Enter a valid display order" })
  .int("Display order must be a whole number")
  .min(0, "Display order must be 0 or greater")
  .max(100000, "Display order is too large");

const buildingNameSchema = z.string().trim().min(1, "Building name is required").max(120);

export const buildingFormSchema = z.object({
  name: buildingNameSchema,
  code: z.string().trim().max(64, "Code must be 64 characters or fewer").optional().or(z.literal("")),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer")
    .optional()
    .or(z.literal("")),
  displayOrder: displayOrderSchema.optional(),
});

export const createBuildingSchema = buildingFormSchema.extend({
  projectId: z.string().uuid("Invalid project id"),
});

export const updateBuildingSchema = buildingFormSchema.extend({
  buildingId: z.string().uuid("Invalid building id"),
});

export const deleteBuildingSchema = z.object({
  buildingId: z.string().uuid("Invalid building id"),
});

export type BuildingFormInput = z.input<typeof buildingFormSchema>;
export type CreateBuildingInput = z.input<typeof createBuildingSchema>;
export type UpdateBuildingInput = z.input<typeof updateBuildingSchema>;
