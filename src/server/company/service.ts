import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { ZodError } from "zod";
import { db } from "@/db";
import {
  companies,
  companyInvitations,
  companyMemberships,
  projectMembers,
  projects,
  pours,
  users,
} from "@/db/schema";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { createRandomToken, hashToken } from "@/lib/auth/crypto";
import { canManageInvitations, canManageMembers, requireCompanyMembership } from "@/lib/auth/company-access";
import { requireProjectAccess } from "@/lib/auth/project-access";
import { requireTenantUser } from "@/lib/auth/session";
import {
  assignProjectMemberSchema,
  companyOnboardingSchema,
  inviteMemberSchema,
  resendInvitationSchema,
  revokeInvitationSchema,
  updateMembershipRoleSchema,
  type AssignProjectMemberInput,
  type CompanyOnboardingInput,
  type InviteMemberInput,
  type UpdateMembershipRoleInput,
} from "@/lib/validation/company";
import { acceptInvitationSchema, type AcceptInvitationInput } from "@/lib/validation/invitation";
import { failure, success, type ActionResult } from "@/lib/utils/action-result";
import { env } from "@/lib/env/server";
import { createProject } from "@/server/projects/service";
import { sendCompanyInvitationEmail } from "@/server/auth/email";
import { recordActivityEvent } from "@/server/activity/service";

function zodFieldErrors(error: ZodError) {
  const flattened = error.flatten().fieldErrors;
  return Object.fromEntries(
    Object.entries(flattened)
      .map(([key, value]) => [key, value?.[0]])
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
}

function normalizeOptionalText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function slugifyCompanyName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

async function getInvitationById(companyId: string, invitationId: string) {
  return db.query.companyInvitations.findFirst({
    where: and(eq(companyInvitations.companyId, companyId), eq(companyInvitations.id, invitationId)),
  });
}

async function getInvitationByToken(token: string) {
  return db.query.companyInvitations.findFirst({
    where: eq(companyInvitations.tokenHash, hashToken(token)),
  });
}

async function requireCompanyAdminAccess(companyId: string) {
  const user = await requireTenantUser();
  const allowed = await canManageMembers(user, companyId);

  if (!allowed) {
    throw new Error("Company admin access required.");
  }

  return requireCompanyMembership(companyId);
}

export async function getCompanyOverview() {
  const user = await requireTenantUser();
  const access = await requireCompanyMembership(user.companyId);

  const [memberCountRows, activeProjectCountRows, monthlyPourStatsRows, pendingInviteCountRows] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(companyMemberships)
        .where(and(eq(companyMemberships.companyId, access.company.id), eq(companyMemberships.status, "active"))),
      db
        .select({ count: sql<number>`count(*)` })
        .from(projects)
        .where(and(eq(projects.companyId, access.company.id), eq(projects.status, "active"))),
      db
        .select({
          count: sql<number>`count(*)`,
          totalConcrete: sql<number>`coalesce(sum(${pours.actualVolume}), 0)`,
        })
        .from(pours)
        .where(
          and(
            eq(pours.companyId, access.company.id),
            sql`${pours.scheduledDate} >= date_trunc('month', now())::date`
          )
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(companyInvitations)
        .where(
          and(
            eq(companyInvitations.companyId, access.company.id),
            sql`${companyInvitations.acceptedAt} is null`,
            sql`${companyInvitations.revokedAt} is null`,
            sql`${companyInvitations.expiresAt} > now()`
          )
        ),
    ]);

  return {
    company: access.company,
    membershipRole: access.membership.role,
    metrics: {
      totalMembers: memberCountRows[0]?.count ?? 0,
      totalActiveProjects: activeProjectCountRows[0]?.count ?? 0,
      totalPoursThisMonth: monthlyPourStatsRows[0]?.count ?? 0,
      totalConcreteThisMonth: Number(monthlyPourStatsRows[0]?.totalConcrete ?? 0),
      pendingInvitations: pendingInviteCountRows[0]?.count ?? 0,
    },
  };
}

export async function listMembers() {
  const user = await requireTenantUser();
  const access = await requireCompanyMembership(user.companyId);

  const rows = await db
    .select({
      membershipId: companyMemberships.id,
      userId: users.id,
      fullName: users.fullName,
      email: users.email,
      role: companyMemberships.role,
      status: companyMemberships.status,
      joinedAt: companyMemberships.joinedAt,
    })
    .from(companyMemberships)
    .innerJoin(users, eq(companyMemberships.userId, users.id))
    .where(eq(companyMemberships.companyId, access.company.id))
    .orderBy(desc(companyMemberships.createdAt));

  const memberProjectRows =
    rows.length === 0
      ? []
      : await db
          .select({
            userId: projectMembers.userId,
            count: sql<number>`count(*)`,
          })
          .from(projectMembers)
          .where(inArray(projectMembers.userId, rows.map((row) => row.userId)))
          .groupBy(projectMembers.userId);

  const countByUserId = new Map(memberProjectRows.map((row) => [row.userId, row.count]));

  return rows.map((row) => ({
    ...row,
    assignedProjectsCount: countByUserId.get(row.userId) ?? 0,
  }));
}

export async function listInvitations() {
  const user = await requireTenantUser();
  const access = await requireCompanyMembership(user.companyId);
  const allowed = await canManageInvitations(user, access.company.id);

  if (!allowed) {
    throw new Error("Invitation management required.");
  }

  return db
    .select({
      id: companyInvitations.id,
      email: companyInvitations.email,
      role: companyInvitations.role,
      createdAt: companyInvitations.createdAt,
      expiresAt: companyInvitations.expiresAt,
      acceptedAt: companyInvitations.acceptedAt,
      revokedAt: companyInvitations.revokedAt,
      invitedByName: users.fullName,
    })
    .from(companyInvitations)
    .leftJoin(users, eq(companyInvitations.invitedByUserId, users.id))
    .where(eq(companyInvitations.companyId, access.company.id))
    .orderBy(desc(companyInvitations.createdAt))
    .then((rows) =>
      rows.map((row) => ({
        ...row,
        invitedByName: row.invitedByName ?? "System",
      }))
    );
}

export async function inviteMember(
  rawInput: InviteMemberInput
): Promise<ActionResult<{ invitationId: string; inviteUrl: string }>> {
  try {
    assertSameOrigin();
    const user = await requireTenantUser();
    const input = inviteMemberSchema.parse(rawInput);
    const access = await requireCompanyMembership(input.companyId);

    if (access.user.id !== user.id || !(await canManageInvitations(user, input.companyId))) {
      return failure("unauthorized", "You do not have permission to invite members.");
    }

    const existingMember = await db
      .select({ id: companyMemberships.id })
      .from(companyMemberships)
      .innerJoin(users, eq(companyMemberships.userId, users.id))
      .where(
        and(
          eq(companyMemberships.companyId, input.companyId),
          eq(users.email, input.email),
          eq(companyMemberships.status, "active")
        )
      )
      .then((rows) => rows[0] ?? null);

    if (existingMember) {
      return failure("validation_error", "That person is already an active company member.", {
        email: "That person is already an active company member.",
      });
    }

    const token = createRandomToken();
    const inviteUrl = `${env.APP_URL}/auth/accept-invite?token=${token}`;

    const [invitation] = await db
      .insert(companyInvitations)
      .values({
        companyId: input.companyId,
        email: input.email,
        role: input.role,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        invitedByUserId: user.id,
      })
      .returning({ id: companyInvitations.id });

    if (!invitation) {
      return failure("invite_failed", "Unable to create the invitation right now.");
    }

    await recordActivityEvent(db, {
      companyId: input.companyId,
      actorUserId: user.id,
      eventType: "member_invited",
      entityType: "company_invitation",
      entityId: invitation.id,
      summary: `Invited ${input.email} as ${input.role.replaceAll("_", " ")}`,
      metadata: {
        email: input.email,
        role: input.role,
      },
    });

    await sendCompanyInvitationEmail({
      email: input.email,
      inviterName: user.fullName,
      companyName: access.company.name,
      inviteUrl,
      role: input.role,
    });

    return success(
      {
        invitationId: invitation.id,
        inviteUrl,
      },
      "Invitation sent."
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    return failure("invite_failed", "Unable to create the invitation right now.");
  }
}

export async function resendInvitation(
  rawInput: { companyId: string; invitationId: string }
): Promise<ActionResult<{ invitationId: string; inviteUrl: string }>> {
  try {
    assertSameOrigin();
    const user = await requireTenantUser();
    const input = resendInvitationSchema.parse(rawInput);
    const access = await requireCompanyMembership(input.companyId);

    if (access.user.id !== user.id || !(await canManageInvitations(user, input.companyId))) {
      return failure("unauthorized", "You do not have permission to resend invitations.");
    }

    const invitation = await getInvitationById(input.companyId, input.invitationId);
    if (!invitation) {
      return failure("not_found", "Invitation not found.");
    }

    const token = createRandomToken();
    const inviteUrl = `${env.APP_URL}/auth/accept-invite?token=${token}`;

    await db
      .update(companyInvitations)
      .set({
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        revokedAt: null,
      })
      .where(eq(companyInvitations.id, invitation.id));

    await sendCompanyInvitationEmail({
      email: invitation.email,
      inviterName: user.fullName,
      companyName: access.company.name,
      inviteUrl,
      role: invitation.role,
    });

    return success({ invitationId: invitation.id, inviteUrl }, "Invitation resent.");
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Unable to resend that invitation.");
    }

    return failure("invite_failed", "Unable to resend the invitation right now.");
  }
}

export async function revokeInvitation(
  rawInput: { companyId: string; invitationId: string }
): Promise<ActionResult<{ invitationId: string }>> {
  try {
    assertSameOrigin();
    const user = await requireTenantUser();
    const input = revokeInvitationSchema.parse(rawInput);
    const access = await requireCompanyMembership(input.companyId);

    if (access.user.id !== user.id || !(await canManageInvitations(user, input.companyId))) {
      return failure("unauthorized", "You do not have permission to revoke invitations.");
    }

    const invitation = await getInvitationById(input.companyId, input.invitationId);
    if (!invitation) {
      return failure("not_found", "Invitation not found.");
    }

    await db
      .update(companyInvitations)
      .set({ revokedAt: new Date() })
      .where(eq(companyInvitations.id, invitation.id));

    return success({ invitationId: invitation.id }, "Invitation revoked.");
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Unable to revoke that invitation.");
    }

    return failure("invite_failed", "Unable to revoke the invitation right now.");
  }
}

export async function updateMemberRole(
  rawInput: UpdateMembershipRoleInput
): Promise<ActionResult<{ membershipId: string }>> {
  try {
    assertSameOrigin();
    const user = await requireTenantUser();
    const input = updateMembershipRoleSchema.parse(rawInput);
    await requireCompanyAdminAccess(input.companyId);

    const membership = await db.query.companyMemberships.findFirst({
      where: and(eq(companyMemberships.id, input.membershipId), eq(companyMemberships.companyId, input.companyId)),
    });

    if (!membership) {
      return failure("not_found", "Membership not found.");
    }

    await db.transaction(async (tx) => {
      await tx
        .update(companyMemberships)
        .set({
          role: input.role,
          updatedAt: new Date(),
        })
        .where(eq(companyMemberships.id, membership.id));

      await tx
        .update(users)
        .set({
          role: input.role,
          updatedAt: new Date(),
        })
        .where(eq(users.id, membership.userId));

      await recordActivityEvent(tx, {
        companyId: input.companyId,
        actorUserId: user.id,
        eventType: "member_role_changed",
        entityType: "company_membership",
        entityId: membership.id,
        summary: `Updated member role to ${input.role.replaceAll("_", " ")}`,
        metadata: {
          membershipId: membership.id,
          role: input.role,
        },
      });
    });

    return success({ membershipId: membership.id }, "Member role updated.");
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    return failure("update_member_failed", "Unable to update the member role right now.");
  }
}

export async function assignProjectMember(
  rawInput: AssignProjectMemberInput
): Promise<ActionResult<{ projectId: string; userId: string }>> {
  try {
    assertSameOrigin();
    const input = assignProjectMemberSchema.parse(rawInput);
    const access = await requireProjectAccess(input.projectId, "manage");

    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, input.userId),
    });

    if (!targetUser || targetUser.companyId !== access.context.project.companyId) {
      return failure("validation_error", "That user is not part of this company.", {
        userId: "That user is not part of this company.",
      });
    }

    await db.transaction(async (tx) => {
      await tx
        .insert(projectMembers)
        .values({
          projectId: input.projectId,
          userId: input.userId,
          role: input.role,
        })
        .onConflictDoUpdate({
          target: [projectMembers.projectId, projectMembers.userId],
          set: {
            role: input.role,
          },
        });

      await tx
        .update(projects)
        .set({
          projectManagerUserId:
            targetUser.role === "project_manager"
              ? targetUser.id
              : access.context.project.projectManagerUserId,
          superintendentUserId:
            targetUser.role === "field_supervisor"
              ? targetUser.id
              : access.context.project.superintendentUserId,
        })
        .where(eq(projects.id, input.projectId));

      await recordActivityEvent(tx, {
        companyId: access.context.project.companyId,
        projectId: input.projectId,
        actorUserId: access.user.id,
        eventType: "project_updated",
        entityType: "project_member",
        entityId: input.userId,
        summary: `Assigned ${targetUser.fullName} to the project`,
        metadata: {
          userId: input.userId,
          role: input.role,
        },
      });
    });

    return success({ projectId: input.projectId, userId: input.userId }, "Project member assigned.");
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    return failure("assign_project_member_failed", "Unable to assign that project member right now.");
  }
}

export async function acceptInvitation(
  rawInput: AcceptInvitationInput
): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    assertSameOrigin();
    const user = await requireTenantUser();
    const input = acceptInvitationSchema.parse(rawInput);
    const invitation = await getInvitationByToken(input.token);

    if (
      !invitation ||
      invitation.acceptedAt ||
      invitation.revokedAt ||
      invitation.expiresAt.getTime() < Date.now() ||
      invitation.email.toLowerCase() !== user.email.toLowerCase()
    ) {
      return failure(
        "invalid_invitation",
        "This invitation is invalid, expired, revoked, or meant for another email address."
      );
    }

    await db.transaction(async (tx) => {
      await tx
        .insert(companyMemberships)
        .values({
          companyId: invitation.companyId,
          userId: user.id,
          role: invitation.role,
          status: "active",
          invitedByUserId: invitation.invitedByUserId,
          joinedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [companyMemberships.companyId, companyMemberships.userId],
          set: {
            role: invitation.role,
            status: "active",
            joinedAt: new Date(),
            updatedAt: new Date(),
          },
        });

      await tx
        .update(users)
        .set({
          companyId: invitation.companyId,
          role: invitation.role,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      await tx
        .update(companyInvitations)
        .set({
          acceptedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(companyInvitations.id, invitation.id));

      await recordActivityEvent(tx, {
        companyId: invitation.companyId,
        actorUserId: user.id,
        eventType: "member_joined",
        entityType: "company_membership",
        entityId: user.id,
        summary: `${user.fullName} joined the company`,
        metadata: {
          email: user.email,
          role: invitation.role,
        },
      });
    });

    return success({ redirectTo: "/dashboard/company" }, "Invitation accepted.");
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Invalid invitation request.");
    }

    return failure("accept_invitation_failed", "Unable to accept the invitation right now.");
  }
}

export async function getInvitationStatus(token?: string | null) {
  if (!token) {
    return {
      valid: false,
      status: "missing" as const,
      message: "This invitation link is missing a token.",
    };
  }

  const invitation = await getInvitationByToken(token);

  if (!invitation || invitation.revokedAt || invitation.acceptedAt) {
    return {
      valid: false,
      status: "invalid" as const,
      message: "This invitation is no longer available.",
    };
  }

  if (invitation.expiresAt.getTime() < Date.now()) {
    return {
      valid: false,
      status: "expired" as const,
      message: "This invitation has expired.",
    };
  }

  const company = await db.query.companies.findFirst({
    where: eq(companies.id, invitation.companyId),
  });

  return {
    valid: true,
    status: "valid" as const,
    message: "Sign in or create your account to accept this invitation.",
    companyName: company?.name ?? "Company",
    role: invitation.role,
    email: invitation.email,
  };
}

export async function completeCompanyOnboarding(
  rawInput: CompanyOnboardingInput
): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    assertSameOrigin();
    const user = await requireTenantUser();
    const input = companyOnboardingSchema.parse(rawInput);
    const access = await requireCompanyMembership(user.companyId);

    await db.transaction(async (tx) => {
      await tx
        .update(companies)
        .set({
          name: input.companyName.trim(),
          slug: input.companySlug.trim(),
          updatedAt: new Date(),
        })
        .where(eq(companies.id, access.company.id));

      await tx
        .update(companyMemberships)
        .set({
          role: input.userRole,
          updatedAt: new Date(),
        })
        .where(and(eq(companyMemberships.companyId, access.company.id), eq(companyMemberships.userId, user.id)));

      await tx
        .update(users)
        .set({
          role: input.userRole,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    });

    const teammateEmail = normalizeOptionalText(input.teammateEmail);

    if (teammateEmail) {
      await inviteMember({
        companyId: access.company.id,
        email: teammateEmail,
        role: input.teammateRole,
      });
    }

    if (input.createProject) {
      const projectResult = await createProject({
        name: input.projectName ?? "",
        address: input.projectAddress ?? "",
        status: "active",
        description: "",
        projectCode: input.projectCode ?? "",
        dateStarted: input.projectStartDate ?? "",
        estimatedCompletionDate: input.projectEstimatedCompletionDate ?? "",
        estimatedTotalConcrete: input.projectEstimatedTotalConcrete ?? 0,
      });

      if (!projectResult.ok) {
        return failure(
          projectResult.code,
          projectResult.formError ?? "Unable to create the first project right now.",
          projectResult.fieldErrors
        );
      }
    }

    return success({ redirectTo: "/dashboard" }, "Company onboarding completed.");
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    return failure("onboarding_failed", "Unable to complete onboarding right now.");
  }
}
