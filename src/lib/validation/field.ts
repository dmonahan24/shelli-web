import { z } from "zod";
import { attachmentTypeSchema } from "@/lib/validation/attachment";

const optionalTrimmed = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength, `Must be ${maxLength} characters or fewer`)
    .optional()
    .or(z.literal(""));

export const quickPourSchema = z.object({
  projectId: z.string().uuid("Invalid project id"),
  pourDate: z.string().min(1, "Pour date is required"),
  concreteAmount: z.coerce
    .number({ invalid_type_error: "Enter a valid concrete amount" })
    .positive("Concrete amount must be greater than 0"),
  locationDescription: z
    .string()
    .trim()
    .min(1, "Location description is required")
    .max(200, "Location description must be 200 characters or fewer"),
  mixType: optionalTrimmed(120),
  supplierName: optionalTrimmed(120),
  ticketNumber: optionalTrimmed(120),
  crewNotes: optionalTrimmed(2000),
  weatherNotes: optionalTrimmed(2000),
  clientSubmissionId: z
    .string()
    .trim()
    .min(8, "Submission id is required")
    .max(120, "Submission id must be 120 characters or fewer"),
});

export const fieldAttachmentUploadSchema = z.object({
  projectId: z.string().uuid("Invalid project id"),
  attachmentType: attachmentTypeSchema,
  caption: optionalTrimmed(500),
});

export type QuickPourInput = z.infer<typeof quickPourSchema>;
