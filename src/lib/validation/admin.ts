import { z } from "zod";
import {
  accessRequestStatusValues,
  appUserRoleValues,
  adminUserStatusValues,
} from "@/lib/auth/principal";

export const companyProvisionModeValues = ["existing", "new"] as const;

export const companySlugSchema = z
  .string()
  .trim()
  .min(3, "Company slug must be at least 3 characters")
  .max(64, "Company slug must be 64 characters or fewer")
  .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only");

export const createCompanySchema = z.object({
  name: z.string().trim().min(1, "Company name is required"),
  slug: companySlugSchema,
});

const optionalNotesSchema = z
  .string()
  .trim()
  .max(1000, "Notes must be 1000 characters or fewer")
  .optional()
  .or(z.literal(""));

const requiredNotesSchema = z
  .string()
  .trim()
  .min(1, "A note is required for this action.")
  .max(1000, "Notes must be 1000 characters or fewer");

export const approveAccessRequestSchema = z
  .object({
    requestId: z.string().uuid("Invalid access request id"),
    companyProvisionMode: z.enum(companyProvisionModeValues).default("existing"),
    companyId: z.string().uuid("Invalid company id").optional().or(z.literal("")),
    newCompanyName: z.string().trim().optional().or(z.literal("")),
    newCompanySlug: z.string().trim().optional().or(z.literal("")),
    targetRole: z.enum(appUserRoleValues),
    notes: optionalNotesSchema,
  })
  .superRefine((value, ctx) => {
    if (value.companyProvisionMode === "existing" && !value.companyId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyId"],
        message: "Choose a company to assign.",
      });
    }

    if (value.companyProvisionMode === "new") {
      if (!value.newCompanyName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["newCompanyName"],
          message: "Company name is required.",
        });
      }

      const slugResult = companySlugSchema.safeParse(value.newCompanySlug);
      if (!slugResult.success) {
        for (const issue of slugResult.error.issues) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["newCompanySlug"],
            message: issue.message,
          });
        }
      }
    }
  });

export const rejectAccessRequestSchema = z.object({
  requestId: z.string().uuid("Invalid access request id"),
  notes: optionalNotesSchema,
});

export const provisionCompanyUserSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  companyId: z.string().uuid("Choose a company"),
  role: z.enum(appUserRoleValues),
  fullName: z
    .string()
    .trim()
    .max(160, "Full name must be 160 characters or fewer")
    .optional()
    .or(z.literal("")),
  notes: optionalNotesSchema,
});

export const grantPlatformAdminSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  fullName: z
    .string()
    .trim()
    .max(160, "Full name must be 160 characters or fewer")
    .optional()
    .or(z.literal("")),
});

export const updateCompanySchema = z.object({
  companyId: z.string().uuid("Invalid company id"),
  name: z.string().trim().min(1, "Company name is required"),
  slug: companySlugSchema,
  notes: optionalNotesSchema,
});

export const toggleCompanyArchivedSchema = z.object({
  companyId: z.string().uuid("Invalid company id"),
  shouldArchive: z.boolean(),
  notes: requiredNotesSchema,
});

export const updateAdminUserAccessSchema = z.object({
  authUserId: z.string().uuid("Invalid auth user id"),
  companyId: z.string().uuid("Choose a company"),
  role: z.enum(appUserRoleValues),
  fullName: z
    .string()
    .trim()
    .max(160, "Full name must be 160 characters or fewer")
    .optional()
    .or(z.literal("")),
  notes: optionalNotesSchema,
});

export const toggleAdminUserActiveSchema = z.object({
  authUserId: z.string().uuid("Invalid auth user id"),
  isActive: z.boolean(),
  notes: requiredNotesSchema,
});

export const revokePlatformAdminSchema = z.object({
  platformAdminId: z.string().uuid("Invalid platform admin id"),
  notes: requiredNotesSchema,
});

export const accessRequestStatusSchema = z.enum(accessRequestStatusValues);
export const adminUserStatusSchema = z.enum(adminUserStatusValues);

export type CreateCompanyInput = z.input<typeof createCompanySchema>;
export type ApproveAccessRequestInput = z.input<typeof approveAccessRequestSchema>;
export type RejectAccessRequestInput = z.input<typeof rejectAccessRequestSchema>;
export type ProvisionCompanyUserInput = z.input<typeof provisionCompanyUserSchema>;
export type GrantPlatformAdminInput = z.input<typeof grantPlatformAdminSchema>;
export type UpdateCompanyInput = z.input<typeof updateCompanySchema>;
export type ToggleCompanyArchivedInput = z.input<typeof toggleCompanyArchivedSchema>;
export type UpdateAdminUserAccessInput = z.input<typeof updateAdminUserAccessSchema>;
export type ToggleAdminUserActiveInput = z.input<typeof toggleAdminUserActiveSchema>;
export type RevokePlatformAdminInput = z.input<typeof revokePlatformAdminSchema>;
