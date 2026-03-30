import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { ZodError } from "zod";
import { db } from "@/db";
import {
  accessRequests,
  adminAuditEvents,
  companies,
  platformAdmins,
  pours,
  projects,
  users,
} from "@/db/schema";
import {
  type AdminUserStatus,
  type AppUserRole,
} from "@/lib/auth/principal";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { normalizeEmail } from "@/lib/auth/password";
import { requirePlatformAdmin } from "@/lib/auth/session";
import {
  approveAccessRequestSchema,
  createCompanySchema,
  grantPlatformAdminSchema,
  provisionCompanyUserSchema,
  rejectAccessRequestSchema,
  revokePlatformAdminSchema,
  toggleAdminUserActiveSchema,
  toggleCompanyArchivedSchema,
  updateAdminUserAccessSchema,
  updateCompanySchema,
  type ApproveAccessRequestInput,
  type CreateCompanyInput,
  type GrantPlatformAdminInput,
  type ProvisionCompanyUserInput,
  type RejectAccessRequestInput,
  type RevokePlatformAdminInput,
  type ToggleAdminUserActiveInput,
  type ToggleCompanyArchivedInput,
  type UpdateAdminUserAccessInput,
  type UpdateCompanyInput,
} from "@/lib/validation/admin";
import { failure, success, type ActionResult } from "@/lib/utils/action-result";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const activeOperationalPourStatuses = ["planned", "ready", "in_progress", "delayed"] as const;

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

function sortByName<T extends { fullName: string; email: string }>(left: T, right: T) {
  return left.fullName.localeCompare(right.fullName) || left.email.localeCompare(right.email);
}

function getAdminUserStatus(input: {
  isPlatformAdmin: boolean;
  hasTenantProfile: boolean;
  isTenantActive: boolean;
  hasAccessRequest: boolean;
}): AdminUserStatus {
  if (input.isPlatformAdmin) {
    return "platform_admin";
  }

  if (input.hasTenantProfile) {
    return input.isTenantActive ? "tenant_active" : "tenant_inactive";
  }

  if (input.hasAccessRequest) {
    return "pending_access";
  }

  return "unassigned_auth_user";
}

async function listAllAuthUsers() {
  const supabase = createSupabaseAdminClient();
  const authUsers = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const usersResult = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (usersResult.error) {
      throw usersResult.error;
    }

    authUsers.push(...usersResult.data.users);

    if (usersResult.data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  return authUsers;
}

type AuthDirectoryUser = Awaited<ReturnType<typeof listAllAuthUsers>>[number];

async function findAuthUserByEmail(email: string) {
  const authUsers = await listAllAuthUsers();
  return authUsers.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function getCompanyRecord(companyId: string) {
  const company = await db.query.companies.findFirst({
    where: eq(companies.id, companyId),
  });

  if (!company) {
    throw new Error("Company not found.");
  }

  return company;
}

async function requireActiveCompany(companyId: string) {
  const company = await getCompanyRecord(companyId);
  if (!company.isActive) {
    throw new Error("Company is archived.");
  }

  return company;
}

async function getAccessRequestRecord(requestId: string) {
  const accessRequest = await db.query.accessRequests.findFirst({
    where: eq(accessRequests.id, requestId),
  });

  if (!accessRequest) {
    throw new Error("Access request not found.");
  }

  return accessRequest;
}

async function getTenantUserProfile(authUserId: string) {
  return db.query.users.findFirst({
    where: eq(users.id, authUserId),
  });
}

async function countActivePlatformAdmins() {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(platformAdmins)
    .where(eq(platformAdmins.isActive, true));

  return row?.count ?? 0;
}

async function getCompanyUsageCounts(companyId: string) {
  const [activeUserCountRow, activeProjectCountRow, activePourCountRow] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.companyId, companyId), eq(users.isActive, true))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(and(eq(projects.companyId, companyId), eq(projects.status, "active"))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(pours)
      .where(
        and(
          eq(pours.companyId, companyId),
          inArray(pours.status, [...activeOperationalPourStatuses])
        )
      ),
  ]);

  return {
    activeUsers: activeUserCountRow[0]?.count ?? 0,
    activeProjects: activeProjectCountRow[0]?.count ?? 0,
    activePours: activePourCountRow[0]?.count ?? 0,
  };
}

function authUserFullName(input: {
  authUser?: AuthDirectoryUser | null;
  fallbackFullName?: string | null;
  fallbackEmail: string;
}) {
  return (
    (typeof input.authUser?.user_metadata?.full_name === "string"
      ? input.authUser.user_metadata.full_name
      : null) ??
    normalizeOptionalText(input.fallbackFullName) ??
    input.fallbackEmail
  );
}

async function writeAdminAuditEvent(input: {
  actorPlatformAdminId: string;
  actionType: string;
  summary: string;
  targetAuthUserId?: string | null;
  targetCompanyId?: string | null;
  notes?: string | null;
  beforeDetailsJson?: Record<string, unknown>;
  afterDetailsJson?: Record<string, unknown>;
}) {
  await db.insert(adminAuditEvents).values({
    actorPlatformAdminId: input.actorPlatformAdminId,
    actionType: input.actionType,
    summary: input.summary,
    targetAuthUserId: input.targetAuthUserId ?? null,
    targetCompanyId: input.targetCompanyId ?? null,
    notes: normalizeOptionalText(input.notes),
    beforeDetailsJson: input.beforeDetailsJson ?? {},
    afterDetailsJson: input.afterDetailsJson ?? {},
  });
}

async function createCompanyRecord(input: {
  name: string;
  slug: string;
}) {
  const existingCompany = await db.query.companies.findFirst({
    where: eq(companies.slug, input.slug),
  });

  if (existingCompany) {
    return null;
  }

  const [company] = await db
    .insert(companies)
    .values({
      name: input.name,
      slug: input.slug,
      isActive: true,
    })
    .returning();

  return company ?? null;
}

async function syncAccessRequestAfterAssignment(input: {
  authUserId: string;
  companyId: string;
  role: AppUserRole;
  platformAdminId: string;
  notes?: string | null;
}) {
  const existingAccessRequest = await db.query.accessRequests.findFirst({
    where: eq(accessRequests.authUserId, input.authUserId),
  });

  if (!existingAccessRequest) {
    return;
  }

  await db
    .update(accessRequests)
    .set({
      status: "approved",
      resolvedAt: new Date(),
      resolvedByPlatformAdminId: input.platformAdminId,
      targetCompanyId: input.companyId,
      targetRole: input.role,
      notes: normalizeOptionalText(input.notes) ?? existingAccessRequest.notes,
      updatedAt: sql`now()`,
    })
    .where(eq(accessRequests.id, existingAccessRequest.id));
}

async function saveTenantUserAccess(input: {
  platformAdminId: string;
  authUserId: string;
  companyId: string;
  email: string;
  fullName: string;
  role: AppUserRole;
  notes?: string | null;
}) {
  const company = await requireActiveCompany(input.companyId);
  const existingProfile = await getTenantUserProfile(input.authUserId);
  const changeNote = normalizeOptionalText(input.notes);

  if (
    existingProfile &&
    existingProfile.companyId !== input.companyId &&
    !changeNote
  ) {
    return failure("validation_error", "Please fix the highlighted fields.", {
      notes: "A note is required when reassigning a user to another company.",
    });
  }

  const beforeProfile = existingProfile
    ? {
        companyId: existingProfile.companyId,
        email: existingProfile.email,
        fullName: existingProfile.fullName,
        role: existingProfile.role,
        isActive: existingProfile.isActive,
      }
    : null;

  const [profile] = await db
    .insert(users)
    .values({
      id: input.authUserId,
      companyId: input.companyId,
      email: input.email,
      fullName: input.fullName,
      role: input.role,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        companyId: input.companyId,
        email: input.email,
        fullName: input.fullName,
        role: input.role,
        isActive: true,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  if (!profile) {
    throw new Error("Unable to save the tenant profile.");
  }

  await syncAccessRequestAfterAssignment({
    authUserId: input.authUserId,
    companyId: input.companyId,
    role: input.role,
    platformAdminId: input.platformAdminId,
    notes: input.notes,
  });

  const actionType = !existingProfile
    ? "tenant_user_assigned"
    : existingProfile.companyId !== input.companyId
      ? "tenant_user_reassigned"
      : !existingProfile.isActive
        ? "tenant_user_reactivated"
        : existingProfile.role !== input.role
          ? "tenant_user_role_updated"
          : "tenant_user_access_updated";

  const summary = !existingProfile
    ? `Assigned ${input.fullName} to ${company.name}.`
    : existingProfile.companyId !== input.companyId
      ? `Reassigned ${input.fullName} to ${company.name}.`
      : !existingProfile.isActive
        ? `Reactivated ${input.fullName}.`
        : existingProfile.role !== input.role
          ? `Updated ${input.fullName}'s tenant role.`
          : `Updated ${input.fullName}'s tenant access.`;

  await writeAdminAuditEvent({
    actorPlatformAdminId: input.platformAdminId,
    actionType,
    summary,
    targetAuthUserId: input.authUserId,
    targetCompanyId: input.companyId,
    notes: input.notes,
    beforeDetailsJson: beforeProfile ?? {},
    afterDetailsJson: {
      companyId: profile.companyId,
      email: profile.email,
      fullName: profile.fullName,
      role: profile.role,
      isActive: profile.isActive,
    },
  });

  return success(
    {
      companyId: profile.companyId,
      userId: profile.id,
    },
    existingProfile ? "Tenant access updated." : "Tenant profile provisioned."
  );
}

function mapCompanyUsersById(
  userRows: Array<{
    id: string;
    companyId: string;
    email: string;
    fullName: string;
    role: AppUserRole;
    isActive: boolean;
  }>
) {
  const usersByCompanyId = new Map<string, Array<(typeof userRows)[number]>>();

  for (const user of userRows) {
    const existing = usersByCompanyId.get(user.companyId) ?? [];
    existing.push(user);
    usersByCompanyId.set(user.companyId, existing);
  }

  return usersByCompanyId;
}

export async function listPlatformAdmins() {
  await requirePlatformAdmin();

  return db
    .select({
      id: platformAdmins.id,
      email: platformAdmins.email,
      fullName: platformAdmins.fullName,
      isActive: platformAdmins.isActive,
      createdAt: platformAdmins.createdAt,
    })
    .from(platformAdmins)
    .orderBy(asc(platformAdmins.fullName), asc(platformAdmins.email));
}

export async function listCompaniesWithUsers() {
  await requirePlatformAdmin();

  const [companyRows, userRows] = await Promise.all([
    db
      .select({
        id: companies.id,
        name: companies.name,
        slug: companies.slug,
        isActive: companies.isActive,
        createdAt: companies.createdAt,
      })
      .from(companies)
      .orderBy(asc(companies.name)),
    db
      .select({
        id: users.id,
        companyId: users.companyId,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .orderBy(asc(users.fullName), asc(users.email)),
  ]);

  const usersByCompanyId = mapCompanyUsersById(userRows);

  return companyRows.map((company) => ({
    ...company,
    users: usersByCompanyId.get(company.id) ?? [],
  }));
}

export async function listAdminUsers() {
  await requirePlatformAdmin();

  const [authUsers, companyRows, userRows, accessRequestRows, platformAdminRows] =
    await Promise.all([
      listAllAuthUsers(),
      db
        .select({
          id: companies.id,
          name: companies.name,
          slug: companies.slug,
          isActive: companies.isActive,
        })
        .from(companies)
        .orderBy(asc(companies.name)),
      db
        .select({
          id: users.id,
          companyId: users.companyId,
          email: users.email,
          fullName: users.fullName,
          role: users.role,
          isActive: users.isActive,
        })
        .from(users),
      db
        .select({
          id: accessRequests.id,
          authUserId: accessRequests.authUserId,
          status: accessRequests.status,
          requestedAt: accessRequests.requestedAt,
          resolvedAt: accessRequests.resolvedAt,
          notes: accessRequests.notes,
          targetCompanyId: accessRequests.targetCompanyId,
          targetRole: accessRequests.targetRole,
        })
        .from(accessRequests),
      db
        .select({
          id: platformAdmins.id,
          email: platformAdmins.email,
          fullName: platformAdmins.fullName,
          isActive: platformAdmins.isActive,
        })
        .from(platformAdmins),
    ]);

  const companiesById = new Map(companyRows.map((company) => [company.id, company]));
  const profilesById = new Map(userRows.map((profile) => [profile.id, profile]));
  const requestsByAuthUserId = new Map(
    accessRequestRows.map((request) => [request.authUserId, request])
  );
  const platformAdminsById = new Map(
    platformAdminRows.map((platformAdmin) => [platformAdmin.id, platformAdmin])
  );

  const adminUsers = authUsers
    .map((authUser) => {
      const profile = profilesById.get(authUser.id) ?? null;
      const accessRequest = requestsByAuthUserId.get(authUser.id) ?? null;
      const platformAdmin = platformAdminsById.get(authUser.id) ?? null;
      const company = profile ? companiesById.get(profile.companyId) ?? null : null;
      const email = normalizeEmail(authUser.email ?? profile?.email ?? "");
      const fullName = authUserFullName({
        authUser,
        fallbackFullName: profile?.fullName ?? null,
        fallbackEmail: email,
      });

      return {
        authUserId: authUser.id,
        email,
        fullName,
        companyId: profile?.companyId ?? accessRequest?.targetCompanyId ?? null,
        companyName: company?.name ?? null,
        companyIsActive: company?.isActive ?? null,
        role: profile?.role ?? accessRequest?.targetRole ?? null,
        userStatus: getAdminUserStatus({
          isPlatformAdmin: Boolean(platformAdmin?.isActive),
          hasTenantProfile: Boolean(profile),
          isTenantActive: Boolean(profile?.isActive),
          hasAccessRequest: Boolean(accessRequest),
        }),
        tenantIsActive: profile?.isActive ?? null,
        platformAdminIsActive: platformAdmin?.isActive ?? false,
        accessRequestStatus: accessRequest?.status ?? null,
        accessRequestNotes: accessRequest?.notes ?? null,
        accessRequestedAt: accessRequest?.requestedAt ?? null,
        accessResolvedAt: accessRequest?.resolvedAt ?? null,
        lastSignInAt: authUser.last_sign_in_at ?? null,
      };
    })
    .sort(sortByName);

  return {
    companies: companyRows,
    users: adminUsers,
  };
}

export async function listAccessRequests() {
  await requirePlatformAdmin();

  const [requestRows, companyRows, platformAdminRows] = await Promise.all([
    db
      .select({
        id: accessRequests.id,
        authUserId: accessRequests.authUserId,
        email: accessRequests.email,
        fullName: accessRequests.fullName,
        status: accessRequests.status,
        requestedAt: accessRequests.requestedAt,
        resolvedAt: accessRequests.resolvedAt,
        resolvedByPlatformAdminId: accessRequests.resolvedByPlatformAdminId,
        targetCompanyId: accessRequests.targetCompanyId,
        targetRole: accessRequests.targetRole,
        notes: accessRequests.notes,
      })
      .from(accessRequests)
      .orderBy(desc(accessRequests.requestedAt)),
    db
      .select({
        id: companies.id,
        name: companies.name,
        slug: companies.slug,
        isActive: companies.isActive,
      })
      .from(companies)
      .where(eq(companies.isActive, true))
      .orderBy(asc(companies.name)),
    db
      .select({
        id: platformAdmins.id,
        fullName: platformAdmins.fullName,
      })
      .from(platformAdmins)
      .orderBy(asc(platformAdmins.fullName), asc(platformAdmins.email)),
  ]);

  const companiesById = new Map(companyRows.map((company) => [company.id, company]));
  const platformAdminsById = new Map(
    platformAdminRows.map((platformAdmin) => [platformAdmin.id, platformAdmin])
  );

  return {
    companies: companyRows,
    requests: requestRows.map((request) => ({
      ...request,
      companyName: request.targetCompanyId
        ? companiesById.get(request.targetCompanyId)?.name ?? null
        : null,
      resolvedByName: request.resolvedByPlatformAdminId
        ? platformAdminsById.get(request.resolvedByPlatformAdminId)?.fullName ?? null
        : null,
    })),
  };
}

export async function getAdminDashboardData() {
  await requirePlatformAdmin();

  const [platformAdminRows, pendingRequestCountRows, activeCompanyCountRows, recentAccessRequests] =
    await Promise.all([
      listPlatformAdmins(),
      db
        .select({ count: sql<number>`count(*)` })
        .from(accessRequests)
        .where(eq(accessRequests.status, "pending")),
      db
        .select({ count: sql<number>`count(*)` })
        .from(companies)
        .where(eq(companies.isActive, true)),
      db
        .select({
          id: accessRequests.id,
          email: accessRequests.email,
          fullName: accessRequests.fullName,
          requestedAt: accessRequests.requestedAt,
          status: accessRequests.status,
        })
        .from(accessRequests)
        .orderBy(desc(accessRequests.requestedAt))
        .limit(5),
    ]);

  return {
    overview: {
      pendingRequests: pendingRequestCountRows[0]?.count ?? 0,
      companyCount: activeCompanyCountRows[0]?.count ?? 0,
      platformAdminCount: platformAdminRows.filter((admin) => admin.isActive).length,
    },
    recentAccessRequests,
    platformAdmins: platformAdminRows,
  };
}

export async function createCompany(
  rawInput: CreateCompanyInput
): Promise<ActionResult<{ companyId: string }>> {
  try {
    assertSameOrigin();
    const platformAdmin = await requirePlatformAdmin();
    const input = createCompanySchema.parse(rawInput);
    const company = await createCompanyRecord({
      name: input.name.trim(),
      slug: input.slug.trim().toLowerCase(),
    });

    if (!company) {
      return failure("validation_error", "Please fix the highlighted fields.", {
        slug: "A company with that slug already exists.",
      });
    }

    await writeAdminAuditEvent({
      actorPlatformAdminId: platformAdmin.id,
      actionType: "company_created",
      summary: `Created company ${company.name}.`,
      targetCompanyId: company.id,
      afterDetailsJson: {
        name: company.name,
        slug: company.slug,
        isActive: company.isActive,
      },
    });

    return success({ companyId: company.id }, "Company created.");
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    if (error instanceof Error && error.message === "Platform admin access required.") {
      return failure("unauthorized", "Only platform admins can create companies.");
    }

    return failure("create_company_failed", "Unable to create the company right now.");
  }
}

export async function updateCompany(
  rawInput: UpdateCompanyInput
): Promise<ActionResult<{ companyId: string }>> {
  try {
    assertSameOrigin();
    const platformAdmin = await requirePlatformAdmin();
    const input = updateCompanySchema.parse(rawInput);
    const existingCompany = await getCompanyRecord(input.companyId);

    const conflictingCompany = await db.query.companies.findFirst({
      where: and(
        eq(companies.slug, input.slug.trim().toLowerCase()),
        ne(companies.id, input.companyId)
      ),
    });

    if (conflictingCompany) {
      return failure("validation_error", "Please fix the highlighted fields.", {
        slug: "A company with that slug already exists.",
      });
    }

    const [company] = await db
      .update(companies)
      .set({
        name: input.name.trim(),
        slug: input.slug.trim().toLowerCase(),
        updatedAt: sql`now()`,
      })
      .where(eq(companies.id, input.companyId))
      .returning();

    if (!company) {
      throw new Error("Company not found.");
    }

    await writeAdminAuditEvent({
      actorPlatformAdminId: platformAdmin.id,
      actionType: "company_updated",
      summary: `Updated company ${company.name}.`,
      targetCompanyId: company.id,
      notes: input.notes,
      beforeDetailsJson: {
        name: existingCompany.name,
        slug: existingCompany.slug,
        isActive: existingCompany.isActive,
      },
      afterDetailsJson: {
        name: company.name,
        slug: company.slug,
        isActive: company.isActive,
      },
    });

    return success({ companyId: company.id }, "Company updated.");
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    if (error instanceof Error && error.message === "Platform admin access required.") {
      return failure("unauthorized", "Only platform admins can update companies.");
    }

    if (error instanceof Error && error.message === "Company not found.") {
      return failure("not_found", "That company no longer exists.");
    }

    return failure("update_company_failed", "Unable to update the company right now.");
  }
}

export async function toggleCompanyArchived(
  rawInput: ToggleCompanyArchivedInput
): Promise<ActionResult<{ companyId: string; isActive: boolean }>> {
  try {
    assertSameOrigin();
    const platformAdmin = await requirePlatformAdmin();
    const input = toggleCompanyArchivedSchema.parse(rawInput);
    const existingCompany = await getCompanyRecord(input.companyId);

    if (input.shouldArchive) {
      const usage = await getCompanyUsageCounts(input.companyId);

      if (usage.activeUsers > 0 || usage.activeProjects > 0 || usage.activePours > 0) {
        return failure(
          "company_in_use",
          "Archive is blocked until active users and in-flight operational records are resolved."
        );
      }
    }

    const [company] = await db
      .update(companies)
      .set({
        isActive: !input.shouldArchive,
        updatedAt: sql`now()`,
      })
      .where(eq(companies.id, input.companyId))
      .returning();

    if (!company) {
      throw new Error("Company not found.");
    }

    await writeAdminAuditEvent({
      actorPlatformAdminId: platformAdmin.id,
      actionType: input.shouldArchive ? "company_archived" : "company_restored",
      summary: input.shouldArchive
        ? `Archived company ${company.name}.`
        : `Restored company ${company.name}.`,
      targetCompanyId: company.id,
      notes: input.notes,
      beforeDetailsJson: {
        name: existingCompany.name,
        slug: existingCompany.slug,
        isActive: existingCompany.isActive,
      },
      afterDetailsJson: {
        name: company.name,
        slug: company.slug,
        isActive: company.isActive,
      },
    });

    return success(
      { companyId: company.id, isActive: company.isActive },
      company.isActive ? "Company restored." : "Company archived."
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    if (error instanceof Error && error.message === "Platform admin access required.") {
      return failure("unauthorized", "Only platform admins can archive companies.");
    }

    if (error instanceof Error && error.message === "Company not found.") {
      return failure("not_found", "That company no longer exists.");
    }

    return failure("toggle_company_archived_failed", "Unable to update company status right now.");
  }
}

export async function approveAccessRequest(
  rawInput: ApproveAccessRequestInput
): Promise<ActionResult<{ requestId: string; companyId: string }>> {
  try {
    assertSameOrigin();
    const platformAdmin = await requirePlatformAdmin();
    const input = approveAccessRequestSchema.parse(rawInput);
    const accessRequest = await getAccessRequestRecord(input.requestId);

    let companyId = normalizeOptionalText(input.companyId);
    if (input.companyProvisionMode === "new") {
      const company = await createCompanyRecord({
        name: input.newCompanyName!.trim(),
        slug: input.newCompanySlug!.trim().toLowerCase(),
      });

      if (!company) {
        return failure("validation_error", "Please fix the highlighted fields.", {
          newCompanySlug: "A company with that slug already exists.",
        });
      }

      companyId = company.id;

      await writeAdminAuditEvent({
        actorPlatformAdminId: platformAdmin.id,
        actionType: "company_created",
        summary: `Created company ${company.name} while approving access.`,
        targetCompanyId: company.id,
        notes: input.notes,
        afterDetailsJson: {
          name: company.name,
          slug: company.slug,
          isActive: company.isActive,
        },
      });
    }

    if (!companyId) {
      return failure("validation_error", "Please fix the highlighted fields.", {
        companyId: "Choose a company to assign.",
      });
    }

    const accessResult = await saveTenantUserAccess({
      platformAdminId: platformAdmin.id,
      authUserId: accessRequest.authUserId,
      companyId,
      email: normalizeEmail(accessRequest.email),
      fullName: accessRequest.fullName,
      role: input.targetRole,
      notes: input.notes,
    });

    if (!accessResult.ok) {
      return accessResult;
    }

    await db
      .update(accessRequests)
      .set({
        status: "approved",
        resolvedAt: new Date(),
        resolvedByPlatformAdminId: platformAdmin.id,
        targetCompanyId: companyId,
        targetRole: input.targetRole,
        notes: normalizeOptionalText(input.notes),
        updatedAt: sql`now()`,
      })
      .where(eq(accessRequests.id, accessRequest.id));

    await writeAdminAuditEvent({
      actorPlatformAdminId: platformAdmin.id,
      actionType: "access_request_approved",
      summary: `Approved access request for ${accessRequest.fullName}.`,
      targetAuthUserId: accessRequest.authUserId,
      targetCompanyId: companyId,
      notes: input.notes,
      beforeDetailsJson: {
        status: accessRequest.status,
        targetCompanyId: accessRequest.targetCompanyId,
        targetRole: accessRequest.targetRole,
      },
      afterDetailsJson: {
        status: "approved",
        targetCompanyId: companyId,
        targetRole: input.targetRole,
      },
    });

    return success(
      { requestId: accessRequest.id, companyId },
      "Access request approved."
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    if (
      error instanceof Error &&
      (error.message === "Platform admin access required." ||
        error.message === "Company is archived.")
    ) {
      return failure("unauthorized", "Only platform admins can approve access requests.");
    }

    if (error instanceof Error && error.message === "Access request not found.") {
      return failure("not_found", "That access request no longer exists.");
    }

    if (error instanceof Error && error.message === "Company not found.") {
      return failure("not_found", "That company no longer exists.");
    }

    return failure("approve_access_request_failed", "Unable to approve the access request right now.");
  }
}

export async function rejectAccessRequest(
  rawInput: RejectAccessRequestInput
): Promise<ActionResult<{ requestId: string }>> {
  try {
    assertSameOrigin();
    const platformAdmin = await requirePlatformAdmin();
    const input = rejectAccessRequestSchema.parse(rawInput);
    const accessRequest = await getAccessRequestRecord(input.requestId);

    await db
      .update(accessRequests)
      .set({
        status: "rejected",
        resolvedAt: new Date(),
        resolvedByPlatformAdminId: platformAdmin.id,
        notes: normalizeOptionalText(input.notes),
        updatedAt: sql`now()`,
      })
      .where(eq(accessRequests.id, accessRequest.id));

    await writeAdminAuditEvent({
      actorPlatformAdminId: platformAdmin.id,
      actionType: "access_request_rejected",
      summary: `Rejected access request for ${accessRequest.fullName}.`,
      targetAuthUserId: accessRequest.authUserId,
      targetCompanyId: accessRequest.targetCompanyId,
      notes: input.notes,
      beforeDetailsJson: {
        status: accessRequest.status,
        targetCompanyId: accessRequest.targetCompanyId,
        targetRole: accessRequest.targetRole,
      },
      afterDetailsJson: {
        status: "rejected",
        targetCompanyId: accessRequest.targetCompanyId,
        targetRole: accessRequest.targetRole,
      },
    });

    return success({ requestId: accessRequest.id }, "Access request rejected.");
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    if (error instanceof Error && error.message === "Platform admin access required.") {
      return failure("unauthorized", "Only platform admins can reject access requests.");
    }

    if (error instanceof Error && error.message === "Access request not found.") {
      return failure("not_found", "That access request no longer exists.");
    }

    return failure("reject_access_request_failed", "Unable to reject the access request right now.");
  }
}

export async function provisionCompanyUser(
  rawInput: ProvisionCompanyUserInput
): Promise<ActionResult<{ companyId: string; userId: string }>> {
  try {
    assertSameOrigin();
    const platformAdmin = await requirePlatformAdmin();
    const input = provisionCompanyUserSchema.parse(rawInput);
    const email = normalizeEmail(input.email);
    const authUser = await findAuthUserByEmail(email);

    if (!authUser) {
      return failure("validation_error", "Please fix the highlighted fields.", {
        email: "No Supabase Auth user exists for that email yet.",
      });
    }

    return saveTenantUserAccess({
      platformAdminId: platformAdmin.id,
      authUserId: authUser.id,
      companyId: input.companyId,
      email,
      fullName: authUserFullName({
        authUser,
        fallbackFullName: input.fullName,
        fallbackEmail: email,
      }),
      role: input.role,
      notes: input.notes,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    if (
      error instanceof Error &&
      (error.message === "Platform admin access required." ||
        error.message === "Company is archived.")
    ) {
      return failure("unauthorized", "Only platform admins can provision company users.");
    }

    if (error instanceof Error && error.message === "Company not found.") {
      return failure("not_found", "That company no longer exists.");
    }

    return failure("provision_company_user_failed", "Unable to provision the tenant profile right now.");
  }
}

export async function updateAdminUserAccess(
  rawInput: UpdateAdminUserAccessInput
): Promise<ActionResult<{ companyId: string; userId: string }>> {
  try {
    assertSameOrigin();
    const platformAdmin = await requirePlatformAdmin();
    const input = updateAdminUserAccessSchema.parse(rawInput);
    const authUsers = await listAllAuthUsers();
    const authUser = authUsers.find((candidate) => candidate.id === input.authUserId) ?? null;
    const existingProfile = await getTenantUserProfile(input.authUserId);
    const email = normalizeEmail(authUser?.email ?? existingProfile?.email ?? "");

    if (!email) {
      return failure("validation_error", "Please fix the highlighted fields.", {
        authUserId: "That auth user no longer exists.",
      });
    }

    return saveTenantUserAccess({
      platformAdminId: platformAdmin.id,
      authUserId: input.authUserId,
      companyId: input.companyId,
      email,
      fullName: authUserFullName({
        authUser,
        fallbackFullName: input.fullName ?? existingProfile?.fullName ?? null,
        fallbackEmail: email,
      }),
      role: input.role,
      notes: input.notes,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    if (
      error instanceof Error &&
      (error.message === "Platform admin access required." ||
        error.message === "Company is archived.")
    ) {
      return failure("unauthorized", "Only platform admins can update user access.");
    }

    if (error instanceof Error && error.message === "Company not found.") {
      return failure("not_found", "That company no longer exists.");
    }

    return failure("update_admin_user_access_failed", "Unable to update user access right now.");
  }
}

export async function toggleAdminUserActive(
  rawInput: ToggleAdminUserActiveInput
): Promise<ActionResult<{ userId: string; isActive: boolean }>> {
  try {
    assertSameOrigin();
    const platformAdmin = await requirePlatformAdmin();
    const input = toggleAdminUserActiveSchema.parse(rawInput);
    const existingProfile = await getTenantUserProfile(input.authUserId);

    if (!existingProfile) {
      return failure("not_found", "That tenant profile no longer exists.");
    }

    const [profile] = await db
      .update(users)
      .set({
        isActive: input.isActive,
        updatedAt: sql`now()`,
      })
      .where(eq(users.id, input.authUserId))
      .returning();

    if (!profile) {
      return failure("not_found", "That tenant profile no longer exists.");
    }

    await writeAdminAuditEvent({
      actorPlatformAdminId: platformAdmin.id,
      actionType: input.isActive ? "tenant_user_reactivated" : "tenant_user_deactivated",
      summary: input.isActive
        ? `Reactivated ${profile.fullName}.`
        : `Deactivated ${profile.fullName}.`,
      targetAuthUserId: profile.id,
      targetCompanyId: profile.companyId,
      notes: input.notes,
      beforeDetailsJson: {
        companyId: existingProfile.companyId,
        role: existingProfile.role,
        isActive: existingProfile.isActive,
      },
      afterDetailsJson: {
        companyId: profile.companyId,
        role: profile.role,
        isActive: profile.isActive,
      },
    });

    return success(
      { userId: profile.id, isActive: profile.isActive },
      profile.isActive ? "Tenant user reactivated." : "Tenant user deactivated."
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    if (error instanceof Error && error.message === "Platform admin access required.") {
      return failure("unauthorized", "Only platform admins can change tenant status.");
    }

    return failure("toggle_admin_user_active_failed", "Unable to update tenant status right now.");
  }
}

export async function grantPlatformAdmin(
  rawInput: GrantPlatformAdminInput
): Promise<ActionResult<{ platformAdminId: string }>> {
  try {
    assertSameOrigin();
    const platformAdminActor = await requirePlatformAdmin();
    const input = grantPlatformAdminSchema.parse(rawInput);
    const email = normalizeEmail(input.email);
    const authUser = await findAuthUserByEmail(email);

    if (!authUser) {
      return failure("validation_error", "Please fix the highlighted fields.", {
        email: "No Supabase Auth user exists for that email yet.",
      });
    }

    const fullName = authUserFullName({
      authUser,
      fallbackFullName: input.fullName,
      fallbackEmail: email,
    });

    const existingPlatformAdmin = await db.query.platformAdmins.findFirst({
      where: eq(platformAdmins.id, authUser.id),
    });

    const [platformAdmin] = await db
      .insert(platformAdmins)
      .values({
        id: authUser.id,
        email,
        fullName,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: platformAdmins.id,
        set: {
          email,
          fullName,
          isActive: true,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    if (!platformAdmin) {
      throw new Error("Unable to save platform admin access.");
    }

    await writeAdminAuditEvent({
      actorPlatformAdminId: platformAdminActor.id,
      actionType: existingPlatformAdmin ? "platform_admin_reactivated" : "platform_admin_granted",
      summary: existingPlatformAdmin
        ? `Reactivated platform admin access for ${platformAdmin.fullName}.`
        : `Granted platform admin access to ${platformAdmin.fullName}.`,
      targetAuthUserId: platformAdmin.id,
      beforeDetailsJson: existingPlatformAdmin
        ? {
            email: existingPlatformAdmin.email,
            fullName: existingPlatformAdmin.fullName,
            isActive: existingPlatformAdmin.isActive,
          }
        : {},
      afterDetailsJson: {
        email: platformAdmin.email,
        fullName: platformAdmin.fullName,
        isActive: platformAdmin.isActive,
      },
    });

    return success(
      { platformAdminId: platformAdmin.id },
      "Platform admin access granted."
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    if (error instanceof Error && error.message === "Platform admin access required.") {
      return failure("unauthorized", "Only platform admins can grant platform admin access.");
    }

    return failure("grant_platform_admin_failed", "Unable to grant platform admin access right now.");
  }
}

export async function revokePlatformAdmin(
  rawInput: RevokePlatformAdminInput
): Promise<ActionResult<{ platformAdminId: string; isActive: boolean }>> {
  try {
    assertSameOrigin();
    const platformAdminActor = await requirePlatformAdmin();
    const input = revokePlatformAdminSchema.parse(rawInput);
    const existingPlatformAdmin = await db.query.platformAdmins.findFirst({
      where: eq(platformAdmins.id, input.platformAdminId),
    });

    if (!existingPlatformAdmin) {
      return failure("not_found", "That platform admin no longer exists.");
    }

    if (existingPlatformAdmin.isActive) {
      const activeAdminCount = await countActivePlatformAdmins();
      if (activeAdminCount <= 1) {
        return failure(
          "last_platform_admin",
          "You must keep at least one active platform admin."
        );
      }
    }

    const [platformAdmin] = await db
      .update(platformAdmins)
      .set({
        isActive: false,
        updatedAt: sql`now()`,
      })
      .where(eq(platformAdmins.id, input.platformAdminId))
      .returning();

    if (!platformAdmin) {
      return failure("not_found", "That platform admin no longer exists.");
    }

    await writeAdminAuditEvent({
      actorPlatformAdminId: platformAdminActor.id,
      actionType: "platform_admin_revoked",
      summary: `Revoked platform admin access for ${platformAdmin.fullName}.`,
      targetAuthUserId: platformAdmin.id,
      notes: input.notes,
      beforeDetailsJson: {
        email: existingPlatformAdmin.email,
        fullName: existingPlatformAdmin.fullName,
        isActive: existingPlatformAdmin.isActive,
      },
      afterDetailsJson: {
        email: platformAdmin.email,
        fullName: platformAdmin.fullName,
        isActive: platformAdmin.isActive,
      },
    });

    return success(
      { platformAdminId: platformAdmin.id, isActive: platformAdmin.isActive },
      "Platform admin access revoked."
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    if (error instanceof Error && error.message === "Platform admin access required.") {
      return failure("unauthorized", "Only platform admins can revoke platform admin access.");
    }

    return failure("revoke_platform_admin_failed", "Unable to revoke platform admin access right now.");
  }
}
