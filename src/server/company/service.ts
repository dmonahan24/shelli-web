import { eq, and, asc, desc, inArray, notInArray, or, sql } from "drizzle-orm";
import { ZodError } from "zod";
import { db } from "@/db";
import {
  companies,
  companyInvitations,
  companyMemberships,
  projectMemberInvitationAssignments,
  projectMembers,
  projects,
  pours,
  users,
} from "@/db/schema";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { createRandomToken, hashToken } from "@/lib/auth/crypto";
import { canManageInvitations, canManageMembers, requireCompanyMembership } from "@/lib/auth/company-access";
import type { ProjectRole } from "@/lib/auth/principal";
import { requireProjectAccess } from "@/lib/auth/project-access";
import { requireTenantUser } from "@/lib/auth/session";
import {
  assignProjectMemberSchema,
  bulkAssignProjectMembersSchema,
  companyOnboardingSchema,
  inviteMemberSchema,
  listProjectAccessRostersSchema,
  projectAccessRosterParamsSchema,
  resendInvitationSchema,
  revokeInvitationSchema,
  updateMembershipRoleSchema,
  type AssignProjectMemberInput,
  type BulkAssignProjectMembersInput,
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

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

type ProjectAccessRoster = {
  projectId: string;
  projectName: string;
  hasExplicitAssignments: boolean;
  projectManagerUserId: string | null;
  superintendentUserId: string | null;
  activeMembers: Array<{
    userId: string;
    fullName: string;
    email: string;
    companyRole: string;
    projectRole: string;
    isProjectManager: boolean;
    isSuperintendent: boolean;
  }>;
  pendingInvitees: Array<{
    invitationId: string;
    email: string;
    companyRole: string;
    projectRole: string;
    expiresAt: Date;
    invitedByName: string;
  }>;
  availableMembers: Array<{
    userId: string;
    fullName: string;
    email: string;
    companyRole: string;
  }>;
};

type BulkProjectAssignmentSummary = {
  assignedCount: number;
  invitedCount: number;
  updatedCount: number;
  skippedCount: number;
};

function formatBulkAssignmentSummary(summary: BulkProjectAssignmentSummary) {
  const parts = [
    `${summary.assignedCount} assigned`,
    `${summary.invitedCount} invited`,
    `${summary.updatedCount} updated`,
    `${summary.skippedCount} skipped`,
  ];

  return `Project access saved: ${parts.join(", ")}.`;
}

function isMissingPendingProjectAssignmentSchemaError(error: unknown) {
  const databaseError =
    error && typeof error === "object"
      ? (error as {
          code?: string;
          message?: string;
          detail?: string;
        })
      : null;

  const message = databaseError?.message ?? "";
  const detail = databaseError?.detail ?? "";
  const combined = `${message} ${detail}`;

  return (
    databaseError?.code === "42P01" ||
    databaseError?.code === "42703" ||
    combined.includes("project_member_invitation_assignments")
  );
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

export async function getProjectAccessRoster(rawInput: unknown): Promise<ProjectAccessRoster> {
  const { projectId } = projectAccessRosterParamsSchema.parse(rawInput);
  const access = await requireProjectAccess(projectId, "view");
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  const activeMemberRows = await db
    .select({
      userId: users.id,
      fullName: users.fullName,
      email: users.email,
      companyRole: companyMemberships.role,
      projectRole: projectMembers.role,
    })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .innerJoin(
      companyMemberships,
      and(
        eq(companyMemberships.userId, users.id),
        eq(companyMemberships.companyId, project.companyId),
        eq(companyMemberships.status, "active")
      )
    )
    .where(eq(projectMembers.projectId, projectId))
    .orderBy(asc(users.fullName));

  const missingLeadershipUserIds = [
    project.projectManagerUserId,
    project.superintendentUserId,
  ].filter(
    (value): value is string =>
      Boolean(value) && !activeMemberRows.some((member) => member.userId === value)
  );

  const leadershipOnlyRows =
    missingLeadershipUserIds.length === 0
      ? []
      : await db
          .select({
            userId: users.id,
            fullName: users.fullName,
            email: users.email,
            companyRole: companyMemberships.role,
          })
          .from(companyMemberships)
          .innerJoin(users, eq(companyMemberships.userId, users.id))
          .where(
            and(
              eq(companyMemberships.companyId, project.companyId),
              eq(companyMemberships.status, "active"),
              inArray(users.id, missingLeadershipUserIds)
            )
          )
          .orderBy(asc(users.fullName));

  const normalizedActiveMembers = activeMemberRows.concat(
    leadershipOnlyRows.map((row) => ({
      ...row,
      projectRole: "viewer",
    }))
  );

  const excludedUserIds = new Set(
    normalizedActiveMembers.map((row) => row.userId).concat(
      [project.projectManagerUserId, project.superintendentUserId].filter(
        (value): value is string => Boolean(value)
      )
    )
  );

  const availableMemberRows =
    excludedUserIds.size === 0
      ? await db
          .select({
            userId: users.id,
            fullName: users.fullName,
            email: users.email,
            companyRole: companyMemberships.role,
          })
          .from(companyMemberships)
          .innerJoin(users, eq(companyMemberships.userId, users.id))
          .where(
            and(
              eq(companyMemberships.companyId, project.companyId),
              eq(companyMemberships.status, "active")
            )
          )
          .orderBy(asc(users.fullName))
      : await db
          .select({
            userId: users.id,
            fullName: users.fullName,
            email: users.email,
            companyRole: companyMemberships.role,
          })
          .from(companyMemberships)
          .innerJoin(users, eq(companyMemberships.userId, users.id))
          .where(
            and(
              eq(companyMemberships.companyId, project.companyId),
              eq(companyMemberships.status, "active"),
              notInArray(users.id, Array.from(excludedUserIds))
            )
          )
          .orderBy(asc(users.fullName));

  let pendingInviteRows: Array<{
    invitationId: string;
    email: string;
    companyRole: string;
    projectRole: string;
    expiresAt: Date;
    invitedByName: string | null;
  }> = [];

  try {
    pendingInviteRows = await db
      .select({
        invitationId: companyInvitations.id,
        email: companyInvitations.email,
        companyRole: companyInvitations.role,
        projectRole: projectMemberInvitationAssignments.projectRole,
        expiresAt: companyInvitations.expiresAt,
        invitedByName: users.fullName,
      })
      .from(projectMemberInvitationAssignments)
      .innerJoin(
        companyInvitations,
        eq(projectMemberInvitationAssignments.companyInvitationId, companyInvitations.id)
      )
      .leftJoin(users, eq(companyInvitations.invitedByUserId, users.id))
      .where(
        and(
          eq(projectMemberInvitationAssignments.projectId, projectId),
          sql`${projectMemberInvitationAssignments.acceptedAt} is null`,
          sql`${companyInvitations.acceptedAt} is null`,
          sql`${companyInvitations.revokedAt} is null`,
          sql`${companyInvitations.expiresAt} > now()`
        )
      )
      .orderBy(desc(companyInvitations.createdAt));
  } catch (error) {
    if (!isMissingPendingProjectAssignmentSchemaError(error)) {
      throw error;
    }
  }

  return {
    projectId: project.id,
    projectName: project.name,
    hasExplicitAssignments: access.context.hasExplicitAssignments,
    projectManagerUserId: project.projectManagerUserId ?? null,
    superintendentUserId: project.superintendentUserId ?? null,
    activeMembers: normalizedActiveMembers.map((row) => ({
      ...row,
      isProjectManager: row.userId === project.projectManagerUserId,
      isSuperintendent: row.userId === project.superintendentUserId,
    })),
    pendingInvitees: pendingInviteRows.map((row) => ({
      ...row,
      invitedByName: row.invitedByName ?? "System",
    })),
    availableMembers: availableMemberRows,
  };
}

export async function listProjectAccessRosters(rawInput: unknown) {
  const input = listProjectAccessRostersSchema.parse(rawInput);

  const rosters = await Promise.all(
    input.projectIds.map(async (projectId) => ({
      projectId,
      roster: await getProjectAccessRoster({ projectId }),
    }))
  );

  return Object.fromEntries(rosters.map((entry) => [entry.projectId, entry.roster])) as Record<
    string,
    ProjectAccessRoster
  >;
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
    const input = assignProjectMemberSchema.parse(rawInput);
    const result = await bulkAssignProjectMembers({
      projectId: input.projectId,
      assignments: [
        {
          userId: input.userId,
          projectRole: input.role,
        },
      ],
    });

    if (!result.ok) {
      return failure(result.code, result.formError, result.fieldErrors);
    }

    return success({ projectId: input.projectId, userId: input.userId }, "Project member assigned.");
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    return failure("assign_project_member_failed", "Unable to assign that project member right now.");
  }
}

export async function bulkAssignProjectMembers(
  rawInput: BulkAssignProjectMembersInput
): Promise<
  ActionResult<{
    projectId: string;
    summary: BulkProjectAssignmentSummary;
  }>
> {
  try {
    assertSameOrigin();
    const input = bulkAssignProjectMembersSchema.parse(rawInput);
    const access = await requireProjectAccess(input.projectId, "manage");
    const companyId = access.context.project.companyId;
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, companyId),
    });

    if (!company) {
      return failure("not_found", "Company not found.");
    }

    const requestedUserIds = input.assignments
      .map((assignment) => assignment.userId)
      .filter((value): value is string => Boolean(value));
    const requestedEmails = input.assignments
      .map((assignment) => assignment.email)
      .filter((value): value is string => Boolean(value))
      .map(normalizeEmail);

    const matchedCompanyMembers =
      requestedUserIds.length === 0 && requestedEmails.length === 0
        ? []
        : await db
            .select({
              userId: users.id,
              fullName: users.fullName,
              email: users.email,
              companyRole: companyMemberships.role,
            })
            .from(companyMemberships)
            .innerJoin(users, eq(companyMemberships.userId, users.id))
            .where(
              and(
                eq(companyMemberships.companyId, companyId),
                eq(companyMemberships.status, "active"),
                or(
                  requestedUserIds.length > 0 ? inArray(users.id, requestedUserIds) : undefined,
                  requestedEmails.length > 0 ? inArray(users.email, requestedEmails) : undefined
                )
              )
            );

    const memberByUserId = new Map(matchedCompanyMembers.map((member) => [member.userId, member]));
    const memberByEmail = new Map(
      matchedCompanyMembers.map((member) => [normalizeEmail(member.email), member])
    );

    const invalidExistingAssignment = requestedUserIds.find((userId) => !memberByUserId.has(userId));
    if (invalidExistingAssignment) {
      return failure(
        "validation_error",
        "One or more selected members are no longer active in this company."
      );
    }

    const userIdsMatchedByEmail = new Set(
      requestedEmails
        .map((email) => memberByEmail.get(email)?.userId)
        .filter((value): value is string => Boolean(value))
    );

    const duplicateResolvedUserId = requestedUserIds.find((userId) =>
      userIdsMatchedByEmail.has(userId)
    );

    if (duplicateResolvedUserId) {
      return failure(
        "validation_error",
        "The same person cannot be included as both an existing member and an email invite in one batch."
      );
    }

    const existingAssignments = await db
      .select({
        userId: projectMembers.userId,
        role: projectMembers.role,
      })
      .from(projectMembers)
      .where(eq(projectMembers.projectId, input.projectId));

    const currentRoleByUserId = new Map(
      existingAssignments.map((assignment) => [assignment.userId, assignment.role])
    );
    const currentlyAssignedUserIds = new Set(
      existingAssignments
        .map((assignment) => assignment.userId)
        .concat(
          [
            access.context.project.projectManagerUserId,
            access.context.project.superintendentUserId,
          ].filter((value): value is string => Boolean(value))
        )
    );

    const leadershipCandidateIds = new Set(
      requestedUserIds
        .concat(Array.from(userIdsMatchedByEmail))
        .concat(Array.from(currentlyAssignedUserIds))
    );

    const leadershipIds = [
      input.projectManagerUserId,
      input.superintendentUserId,
    ].filter((value): value is string => Boolean(value));

    for (const leadershipUserId of leadershipIds) {
      if (!leadershipCandidateIds.has(leadershipUserId)) {
        return failure(
          "validation_error",
          "Leadership assignments must reference selected team members or people already assigned to the project."
        );
      }
    }

    const invitationCandidates = requestedEmails.filter((email) => !memberByEmail.has(email));
    const existingInvitations =
      invitationCandidates.length === 0
        ? []
        : await db
            .select({
              id: companyInvitations.id,
              email: companyInvitations.email,
              role: companyInvitations.role,
              expiresAt: companyInvitations.expiresAt,
            })
            .from(companyInvitations)
            .where(
              and(
                eq(companyInvitations.companyId, companyId),
                inArray(companyInvitations.email, invitationCandidates),
                sql`${companyInvitations.acceptedAt} is null`,
                sql`${companyInvitations.revokedAt} is null`,
                sql`${companyInvitations.expiresAt} > now()`
              )
            );

    const invitationByEmail = new Map(
      existingInvitations.map((invitation) => [normalizeEmail(invitation.email), invitation])
    );

    const leadershipRoleRows =
      leadershipIds.length === 0
        ? []
        : await db
            .select({
              userId: users.id,
              companyRole: companyMemberships.role,
            })
            .from(companyMemberships)
            .innerJoin(users, eq(companyMemberships.userId, users.id))
            .where(
              and(
                eq(companyMemberships.companyId, companyId),
                eq(companyMemberships.status, "active"),
                inArray(users.id, leadershipIds)
              )
            );

    const leadershipRoleByUserId = new Map(
      leadershipRoleRows.map((row) => [row.userId, row.companyRole])
    );

    if (
      input.projectManagerUserId &&
      leadershipRoleByUserId.get(input.projectManagerUserId) !== "project_manager"
    ) {
      return failure(
        "validation_error",
        "Only company project managers can be set as the project manager."
      );
    }

    if (
      input.superintendentUserId &&
      leadershipRoleByUserId.get(input.superintendentUserId) !== "field_supervisor"
    ) {
      return failure(
        "validation_error",
        "Only field supervisors can be set as the superintendent."
      );
    }

    const summary: BulkProjectAssignmentSummary = {
      assignedCount: 0,
      invitedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
    };
    const invitationEmailsToSend: Array<{
      email: string;
      role: string;
      inviteUrl: string;
    }> = [];

    await db.transaction(async (tx) => {
      for (const assignment of input.assignments) {
        const requestedEmail = assignment.email ? normalizeEmail(assignment.email) : null;
        const activeCompanyMember =
          (assignment.userId ? memberByUserId.get(assignment.userId) : null) ??
          (requestedEmail ? memberByEmail.get(requestedEmail) : null) ??
          null;

        if (activeCompanyMember) {
          const previousRole = currentRoleByUserId.get(activeCompanyMember.userId) ?? null;

          if (previousRole === assignment.projectRole) {
            summary.skippedCount += 1;
            continue;
          }

          if (previousRole) {
            summary.updatedCount += 1;
          } else {
            summary.assignedCount += 1;
          }

          await tx
            .insert(projectMembers)
            .values({
              projectId: input.projectId,
              userId: activeCompanyMember.userId,
              role: assignment.projectRole,
            })
            .onConflictDoUpdate({
              target: [projectMembers.projectId, projectMembers.userId],
              set: {
                role: assignment.projectRole,
              },
            });

          currentRoleByUserId.set(activeCompanyMember.userId, assignment.projectRole);

          await recordActivityEvent(tx, {
            companyId,
            projectId: input.projectId,
            actorUserId: access.user.id,
            eventType: previousRole ? "project_member_updated" : "project_member_assigned",
            entityType: "project_member",
            entityId: activeCompanyMember.userId,
            summary: previousRole
              ? `Updated ${activeCompanyMember.fullName} to ${assignment.projectRole.replaceAll("_", " ")}`
              : `Assigned ${activeCompanyMember.fullName} to the project as ${assignment.projectRole.replaceAll("_", " ")}`,
            metadata: {
              userId: activeCompanyMember.userId,
              email: activeCompanyMember.email,
              role: assignment.projectRole,
            },
          });

          continue;
        }

        const inviteEmail = requestedEmail!;
        const existingInvitation = invitationByEmail.get(inviteEmail) ?? null;
        let invitationId = existingInvitation?.id ?? null;
        const invitationRoleChanged =
          Boolean(existingInvitation) &&
          Boolean(assignment.companyRole) &&
          existingInvitation?.role !== assignment.companyRole;

        if (!invitationId) {
          const token = createRandomToken();
          const inviteUrl = `${env.APP_URL}/auth/accept-invite?token=${token}`;

          const [createdInvitation] = await tx
            .insert(companyInvitations)
            .values({
              companyId,
              email: inviteEmail,
              role: assignment.companyRole!,
              tokenHash: hashToken(token),
              expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
              invitedByUserId: access.user.id,
            })
            .returning({
              id: companyInvitations.id,
            });

          invitationId = createdInvitation?.id ?? null;

          if (!invitationId) {
            throw new Error("Failed to create project invitation.");
          }

          invitationByEmail.set(inviteEmail, {
            id: invitationId,
            email: inviteEmail,
            role: assignment.companyRole!,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          });
          invitationEmailsToSend.push({
            email: inviteEmail,
            role: assignment.companyRole!,
            inviteUrl,
          });
        } else if (invitationRoleChanged) {
          await tx
            .update(companyInvitations)
            .set({
              role: assignment.companyRole!,
              updatedAt: new Date(),
            })
            .where(eq(companyInvitations.id, invitationId));

          invitationByEmail.set(inviteEmail, {
            id: invitationId,
            email: inviteEmail,
            role: assignment.companyRole!,
            expiresAt: existingInvitation!.expiresAt,
          });
        }

        const existingPendingAssignment = await tx
          .select({
            id: projectMemberInvitationAssignments.id,
            projectRole: projectMemberInvitationAssignments.projectRole,
          })
          .from(projectMemberInvitationAssignments)
          .where(
            and(
              eq(projectMemberInvitationAssignments.companyInvitationId, invitationId),
              eq(projectMemberInvitationAssignments.projectId, input.projectId)
            )
          )
          .then((rows) => rows[0] ?? null);

        if (
          existingPendingAssignment?.projectRole === assignment.projectRole &&
          !invitationRoleChanged
        ) {
          summary.skippedCount += 1;
          continue;
        }

        if (existingPendingAssignment) {
          summary.updatedCount += 1;
        } else {
          summary.invitedCount += 1;
        }

        await tx
          .insert(projectMemberInvitationAssignments)
          .values({
            companyInvitationId: invitationId,
            projectId: input.projectId,
            projectRole: assignment.projectRole,
            createdByUserId: access.user.id,
          })
          .onConflictDoUpdate({
            target: [
              projectMemberInvitationAssignments.companyInvitationId,
              projectMemberInvitationAssignments.projectId,
            ],
            set: {
              projectRole: assignment.projectRole,
            },
          });

        await recordActivityEvent(tx, {
          companyId,
          projectId: input.projectId,
          actorUserId: access.user.id,
          eventType: "project_member_invited",
          entityType: "company_invitation",
          entityId: invitationId,
          summary: `Invited ${inviteEmail} and queued project access as ${assignment.projectRole.replaceAll("_", " ")}`,
          metadata: {
            email: inviteEmail,
            companyRole: assignment.companyRole,
            projectRole: assignment.projectRole,
          },
        });
      }

      if (
        input.projectManagerUserId ||
        input.superintendentUserId ||
        access.context.project.projectManagerUserId ||
        access.context.project.superintendentUserId
      ) {
        await tx
          .update(projects)
          .set({
            projectManagerUserId:
              input.projectManagerUserId || access.context.project.projectManagerUserId || null,
            superintendentUserId:
              input.superintendentUserId || access.context.project.superintendentUserId || null,
          })
          .where(eq(projects.id, input.projectId));

        if (
          input.projectManagerUserId &&
          input.projectManagerUserId !== access.context.project.projectManagerUserId
        ) {
          await recordActivityEvent(tx, {
            companyId,
            projectId: input.projectId,
            actorUserId: access.user.id,
            eventType: "project_updated",
            entityType: "project",
            entityId: input.projectId,
            summary: "Updated project manager assignment",
            metadata: {
              projectManagerUserId: input.projectManagerUserId,
            },
          });
        }

        if (
          input.superintendentUserId &&
          input.superintendentUserId !== access.context.project.superintendentUserId
        ) {
          await recordActivityEvent(tx, {
            companyId,
            projectId: input.projectId,
            actorUserId: access.user.id,
            eventType: "project_updated",
            entityType: "project",
            entityId: input.projectId,
            summary: "Updated superintendent assignment",
            metadata: {
              superintendentUserId: input.superintendentUserId,
            },
          });
        }
      }
    });

    for (const invitation of invitationEmailsToSend) {
      await sendCompanyInvitationEmail({
        email: invitation.email,
        inviterName: access.user.fullName,
        companyName: company.name,
        inviteUrl: invitation.inviteUrl,
        role: invitation.role,
      });
    }

    return success(
      {
        projectId: input.projectId,
        summary,
      },
      formatBulkAssignmentSummary(summary)
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    if (isMissingPendingProjectAssignmentSchemaError(error)) {
      return failure(
        "project_access_schema_missing",
        "Project invite assignments are not available yet. Run the latest database migration and try again."
      );
    }

    return failure(
      "assign_project_member_failed",
      "Unable to update project access right now."
    );
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
      let pendingProjectAssignments: Array<{
        id: string;
        projectId: string;
        projectRole: ProjectRole;
        projectCompanyId: string;
        projectName: string;
      }> = [];

      try {
        pendingProjectAssignments = await tx
          .select({
            id: projectMemberInvitationAssignments.id,
            projectId: projectMemberInvitationAssignments.projectId,
            projectRole: projectMemberInvitationAssignments.projectRole,
            projectCompanyId: projects.companyId,
            projectName: projects.name,
          })
          .from(projectMemberInvitationAssignments)
          .innerJoin(
            projects,
            eq(projectMemberInvitationAssignments.projectId, projects.id)
          )
          .where(
            and(
              eq(projectMemberInvitationAssignments.companyInvitationId, invitation.id),
              sql`${projectMemberInvitationAssignments.acceptedAt} is null`
            )
          );
      } catch (error) {
        if (!isMissingPendingProjectAssignmentSchemaError(error)) {
          throw error;
        }
      }

      const invalidPendingAssignment = pendingProjectAssignments.find(
        (assignment) => assignment.projectCompanyId !== invitation.companyId
      );

      if (invalidPendingAssignment) {
        throw new Error("Invitation has invalid pending project assignments.");
      }

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

      for (const assignment of pendingProjectAssignments) {
        await tx
          .insert(projectMembers)
          .values({
            projectId: assignment.projectId,
            userId: user.id,
            role: assignment.projectRole,
          })
          .onConflictDoUpdate({
            target: [projectMembers.projectId, projectMembers.userId],
            set: {
              role: assignment.projectRole,
            },
          });

        await tx
          .update(projectMemberInvitationAssignments)
          .set({
            acceptedAt: new Date(),
          })
          .where(eq(projectMemberInvitationAssignments.id, assignment.id));

        await recordActivityEvent(tx, {
          companyId: invitation.companyId,
          projectId: assignment.projectId,
          actorUserId: user.id,
          eventType: "project_member_activated",
          entityType: "project_member",
          entityId: user.id,
          summary: `Activated project access for ${user.email} on ${assignment.projectName}`,
          metadata: {
            userId: user.id,
            email: user.email,
            role: assignment.projectRole,
          },
        });
      }

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
