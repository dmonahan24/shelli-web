import { z } from "zod";
import { appUserRoleValues, projectRoleValues } from "@/lib/auth/principal";

export const companyRoleSchema = z.enum(appUserRoleValues);
export const projectMemberRoleSchema = z.enum(projectRoleValues);

export const createCompanySchema = z.object({
  name: z.string().trim().min(2, "Company name must be at least 2 characters"),
  slug: z
    .string()
    .trim()
    .min(2, "Company slug must be at least 2 characters")
    .max(64, "Company slug must be 64 characters or fewer")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only"),
});

export const inviteMemberSchema = z.object({
  companyId: z.string().uuid("Invalid company id"),
  email: z.string().trim().email("Enter a valid email address").transform((value) => value.toLowerCase()),
  role: companyRoleSchema,
});

export const updateMembershipRoleSchema = z.object({
  companyId: z.string().uuid("Invalid company id"),
  membershipId: z.string().uuid("Invalid membership id"),
  role: companyRoleSchema,
});

export const assignProjectMemberSchema = z.object({
  projectId: z.string().uuid("Invalid project id"),
  userId: z.string().uuid("Invalid user id"),
  role: projectMemberRoleSchema,
});

const optionalUserIdSchema = z.string().uuid("Invalid user id").optional().or(z.literal(""));
const optionalEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .transform((value) => value.toLowerCase())
  .optional()
  .or(z.literal(""));

export const bulkProjectAssignmentRowSchema = z
  .object({
    userId: optionalUserIdSchema,
    email: optionalEmailSchema,
    companyRole: companyRoleSchema.optional(),
    projectRole: projectMemberRoleSchema,
  })
  .superRefine((value, ctx) => {
    const hasUserId = Boolean(value.userId);
    const hasEmail = Boolean(value.email);

    if (!hasUserId && !hasEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["userId"],
        message: "Choose an existing member or enter an email address.",
      });
    }

    if (hasUserId && hasEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "Use either an existing member or an email invite, not both.",
      });
    }

    if (hasEmail && !value.companyRole) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyRole"],
        message: "Company role is required for invited users.",
      });
    }

    if (hasUserId && value.companyRole) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyRole"],
        message: "Company role only applies to invited users.",
      });
    }
  });

export const bulkAssignProjectMembersSchema = z
  .object({
    projectId: z.string().uuid("Invalid project id"),
    assignments: z
      .array(bulkProjectAssignmentRowSchema)
      .min(1, "Add at least one team member.")
      .max(50, "You can assign up to 50 people at a time."),
    projectManagerUserId: z.string().uuid("Invalid user id").optional().or(z.literal("")),
    superintendentUserId: z.string().uuid("Invalid user id").optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    const userIds = new Set<string>();
    const emails = new Set<string>();

    value.assignments.forEach((assignment, index) => {
      if (assignment.userId) {
        if (userIds.has(assignment.userId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["assignments", index, "userId"],
            message: "This member appears more than once.",
          });
        }

        userIds.add(assignment.userId);
      }

      if (assignment.email) {
        if (emails.has(assignment.email)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["assignments", index, "email"],
            message: "This email appears more than once.",
          });
        }

        emails.add(assignment.email);
      }
    });

    if (
      value.projectManagerUserId &&
      value.superintendentUserId &&
      value.projectManagerUserId === value.superintendentUserId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["superintendentUserId"],
        message: "Project manager and superintendent must be different people.",
      });
    }
  });

export const projectAccessRosterParamsSchema = z.object({
  projectId: z.string().uuid("Invalid project id"),
});

export const listProjectAccessRostersSchema = z.object({
  projectIds: z
    .array(z.string().uuid("Invalid project id"))
    .min(1, "Select at least one project.")
    .max(50, "You can request up to 50 project rosters at a time."),
});

export const removeProjectMemberSchema = z.object({
  projectId: z.string().uuid("Invalid project id"),
  userId: z.string().uuid("Invalid user id"),
});

export const resendInvitationSchema = z.object({
  companyId: z.string().uuid("Invalid company id"),
  invitationId: z.string().uuid("Invalid invitation id"),
});

export const revokeInvitationSchema = z.object({
  companyId: z.string().uuid("Invalid company id"),
  invitationId: z.string().uuid("Invalid invitation id"),
});

export const companyOnboardingSchema = z.object({
  companyName: z.string().trim().min(2, "Company name must be at least 2 characters"),
  companySlug: z
    .string()
    .trim()
    .min(2, "Company slug must be at least 2 characters")
    .max(64, "Company slug must be 64 characters or fewer")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only"),
  userRole: companyRoleSchema,
  teammateEmail: z
    .string()
    .trim()
    .email("Enter a valid teammate email")
    .transform((value) => value.toLowerCase())
    .optional()
    .or(z.literal("")),
  teammateRole: companyRoleSchema.optional().default("viewer"),
  createProject: z.boolean().default(false),
  projectName: z.string().trim().optional().or(z.literal("")),
  projectAddress: z.string().trim().optional().or(z.literal("")),
  projectCode: z.string().trim().optional().or(z.literal("")),
  projectEstimatedTotalConcrete: z.coerce.number().min(0).optional(),
  projectStartDate: z.string().optional().or(z.literal("")),
  projectEstimatedCompletionDate: z.string().optional().or(z.literal("")),
}).superRefine((value, ctx) => {
  if (!value.createProject) {
    return;
  }

  if (!value.projectName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["projectName"],
      message: "Project name is required when creating your first project",
    });
  }

  if (!value.projectAddress) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["projectAddress"],
      message: "Project address is required when creating your first project",
    });
  }

  if (!value.projectStartDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["projectStartDate"],
      message: "Start date is required when creating your first project",
    });
  }

  if (!value.projectEstimatedCompletionDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["projectEstimatedCompletionDate"],
      message: "Estimated completion date is required when creating your first project",
    });
  }
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMembershipRoleInput = z.infer<typeof updateMembershipRoleSchema>;
export type AssignProjectMemberInput = z.infer<typeof assignProjectMemberSchema>;
export type BulkProjectAssignmentRowInput = z.infer<typeof bulkProjectAssignmentRowSchema>;
export type BulkAssignProjectMembersInput = z.infer<typeof bulkAssignProjectMembersSchema>;
export type CompanyOnboardingInput = z.infer<typeof companyOnboardingSchema>;
