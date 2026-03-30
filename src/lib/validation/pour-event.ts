import { z } from "zod";

const trimmedOptionalString = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength, `Must be ${maxLength} characters or fewer`)
    .optional()
    .or(z.literal(""));

export const pourUnitValues = ["cubic_yards"] as const;
export const pourUnitSchema = z.enum(pourUnitValues);

export const createPourEventSchema = z.object({
  projectId: z.string().uuid("Invalid project id"),
  pourDate: z.string().min(1, "Pour date is required"),
  concreteAmount: z.coerce
    .number({ invalid_type_error: "Enter a valid concrete amount" })
    .positive("Concrete amount must be greater than 0"),
  unit: pourUnitSchema.default("cubic_yards"),
  locationDescription: z
    .string()
    .trim()
    .min(1, "Location description is required")
    .max(200, "Location description must be 200 characters or fewer"),
  mixType: trimmedOptionalString(120),
  supplierName: trimmedOptionalString(120),
  ticketNumber: trimmedOptionalString(120),
  weatherNotes: trimmedOptionalString(2000),
  crewNotes: trimmedOptionalString(2000),
});

export const updatePourEventSchema = createPourEventSchema.extend({
  id: z.string().uuid("Invalid pour event id"),
});

export const deletePourEventSchema = z.object({
  id: z.string().uuid("Invalid pour event id"),
});

export const pourEventListQuerySchema = z.object({
  q: z.string().trim().max(120).catch("").default(""),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(10).default(10),
  sortBy: z.enum(["pourDate", "concreteAmount"]).catch("pourDate").default("pourDate"),
  sortDir: z.enum(["asc", "desc"]).catch("desc").default("desc"),
  dateFrom: z.string().optional().catch(undefined),
  dateTo: z.string().optional().catch(undefined),
  minAmount: z.coerce.number().min(0).optional().catch(undefined),
  maxAmount: z.coerce.number().min(0).optional().catch(undefined),
});

export type CreatePourEventInput = z.input<typeof createPourEventSchema>;
export type UpdatePourEventInput = z.input<typeof updatePourEventSchema>;
export type PourEventListQuery = z.infer<typeof pourEventListQuerySchema>;
