import { z } from "zod";
import { projectStatusSchema } from "@/lib/validation/project";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD dates");

export const analyticsDateRangeSchema = z
  .object({
    from: isoDateSchema,
    to: isoDateSchema,
  })
  .refine((value) => value.from <= value.to, {
    path: ["to"],
    message: "The end date must be on or after the start date",
  })
  .refine((value) => {
    const fromDate = new Date(`${value.from}T00:00:00.000Z`);
    const toDate = new Date(`${value.to}T00:00:00.000Z`);
    const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 366;
  }, {
    path: ["to"],
    message: "Analytics ranges must be one year or less",
  });

export const companyAnalyticsQuerySchema = z.object({
  companyId: z.string().uuid("Invalid company id").optional(),
  dateRange: analyticsDateRangeSchema,
  status: z.union([projectStatusSchema, z.literal("all")]).default("all"),
  assignedOnly: z.boolean().optional().default(false),
});

export const projectAnalyticsQuerySchema = z.object({
  companyId: z.string().uuid("Invalid company id").optional(),
  projectId: z.string().uuid("Invalid project id"),
  dateRange: analyticsDateRangeSchema,
});

export type AnalyticsDateRange = z.infer<typeof analyticsDateRangeSchema>;
export type CompanyAnalyticsQueryInput = z.infer<typeof companyAnalyticsQuerySchema>;
export type ProjectAnalyticsQueryInput = z.infer<typeof projectAnalyticsQuerySchema>;
