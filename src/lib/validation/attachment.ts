import { z } from "zod";

export const attachmentTypeValues = [
  "photo",
  "delivery_ticket",
  "inspection_doc",
  "other",
] as const;

export const attachmentTypeSchema = z.enum(attachmentTypeValues);

export const acceptedAttachmentMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const maxAttachmentSizeBytes = 10 * 1024 * 1024;

export const attachmentUploadSchema = z.object({
  projectId: z.string().uuid("Invalid project id"),
  attachmentType: attachmentTypeSchema,
  caption: z
    .string()
    .trim()
    .max(500, "Caption must be 500 characters or fewer")
    .optional()
    .or(z.literal("")),
});

export const deleteProjectAttachmentSchema = z.object({
  attachmentId: z.string().uuid("Invalid attachment id"),
  projectId: z.string().uuid("Invalid project id"),
});
