import { and, asc, desc, eq, gte, inArray, like, lte, or, sql } from "drizzle-orm";
import { ZodError } from "zod";
import { db, type AppDatabase, type AppTransaction } from "@/db";
import { attachments, projectBuildings, projectMembers, projects, pours } from "@/db/schema";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { requireCompanyMembership } from "@/lib/auth/company-access";
import { hasCompanyPermission } from "@/lib/auth/permissions";
import { listAccessibleProjectIds, requireProjectAccess } from "@/lib/auth/project-access";
import { requireTenantUser } from "@/lib/auth/session";
import {
  createProjectSchema,
  deleteProjectSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "@/lib/validation/project";
import {
  projectDetailParamsSchema,
  projectListQuerySchema,
  type ProjectListQuery,
} from "@/lib/validation/project-list";
import { failure, success, type ActionResult } from "@/lib/utils/action-result";
import { listRecentActivity, recordActivityEvent } from "@/server/activity/service";
import { deleteStoredFile } from "@/server/attachments/storage";

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

type ProjectWriteAction = "create" | "update";

function getProjectWriteFailure(
  error: unknown,
  action: ProjectWriteAction
): ActionResult<never> | null {
  const databaseError =
    error && typeof error === "object"
      ? (error as {
          code?: string;
          constraint_name?: string;
          constraint?: string;
          message?: string;
          detail?: string;
        })
      : null;

  const constraintName = databaseError?.constraint_name ?? databaseError?.constraint ?? "";
  const message = databaseError?.message ?? "";

  if (
    databaseError?.code === "23505" &&
    (constraintName === "projects_company_project_code_idx" ||
      message.includes("projects_company_project_code_idx") ||
      message.includes("(company_id, project_code)"))
  ) {
    return failure(
      "validation_error",
      "Please fix the highlighted fields.",
      {
        projectCode: "A project with that code already exists for this company.",
      }
    );
  }

  if (error instanceof Error && error.message === "User profile not found.") {
    return failure(
      "unauthorized",
      action === "create"
        ? "You must be signed in to create a project."
        : "You must be signed in to update this project."
    );
  }

  return null;
}

function toNumber(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  return value ? Number(value) : 0;
}

export async function listProjects(rawInput?: unknown) {
  const user = await requireTenantUser();
  const input = projectListQuerySchema.parse(rawInput ?? {});
  const accessibleProjectIds = await listAccessibleProjectIds(user, user.companyId);

  if (accessibleProjectIds.length === 0) {
    return {
      rows: [],
      totalCount: 0,
      page: input.page,
      pageSize: input.pageSize,
      pageCount: 1,
      cursor: null as string | null,
    };
  }

  const filters = buildProjectFilters(user.companyId, accessibleProjectIds, input);
  const whereClause = and(...filters);
  const orderByClauses = getProjectOrderBy(input);
  const offset = (input.page - 1) * input.pageSize;

  const [rows, totalCountRows] = await Promise.all([
    db
      .select({
        id: projects.id,
        name: projects.name,
        address: projects.address,
        status: projects.status,
        projectCode: projects.projectCode,
        description: projects.description,
        dateStarted: projects.dateStarted,
        estimatedCompletionDate: projects.estimatedCompletionDate,
        lastPourDate: projects.lastPourDate,
        totalConcretePoured: projects.totalConcretePoured,
        estimatedTotalConcrete: projects.estimatedTotalConcrete,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .where(whereClause)
      .orderBy(...orderByClauses)
      .limit(input.pageSize)
      .offset(offset),
    db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(projects)
      .where(whereClause),
  ]);

  const totalCount = totalCountRows[0]?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / input.pageSize));

  return {
    rows: rows.map((project) => ({
      ...project,
      totalConcretePoured: toNumber(project.totalConcretePoured),
      estimatedTotalConcrete: toNumber(project.estimatedTotalConcrete),
    })),
    totalCount,
    page: input.page,
    pageSize: input.pageSize,
    pageCount,
    cursor: null as string | null,
  };
}

export async function getProjectDetail(rawInput: unknown): Promise<any> {
  const { projectId } = projectDetailParamsSchema.parse(rawInput);
  const access = await requireProjectAccess(projectId, "view");

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

  if (!project) {
    return null;
  }

  const [attachmentCountRows, pourCountRows, buildingCountRows, recentActivity] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(attachments)
      .where(eq(attachments.projectId, projectId)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(pours)
      .where(eq(pours.projectId, projectId)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(projectBuildings)
      .where(eq(projectBuildings.projectId, projectId)),
    listRecentActivity({
      companyId: access.context.project.companyId,
      projectId,
      limit: 6,
    }),
  ]);

  return {
    project: {
      ...project,
      totalConcretePoured: toNumber(project.totalConcretePoured),
      estimatedTotalConcrete: toNumber(project.estimatedTotalConcrete),
    },
    summary: {
      totalBuildings: buildingCountRows[0]?.count ?? 0,
      totalAttachments: attachmentCountRows[0]?.count ?? 0,
      totalPourEvents: pourCountRows[0]?.count ?? 0,
    },
    recentActivity: recentActivity.map((activity) => ({
      ...activity,
      summary: summarizeActivity(activity.summary, activity.eventType, activity.metadataJson),
    })),
  };
}

export async function createProject(
  rawInput: CreateProjectInput
): Promise<ActionResult<{ id: string }>> {
  try {
    assertSameOrigin();
    const user = await requireTenantUser();
    const companyAccess = await requireCompanyMembership(user.companyId);
    const input = createProjectSchema.parse(rawInput);

    if (!hasCompanyPermission(companyAccess.membership.role, "manage_projects")) {
      return failure("unauthorized", "You do not have permission to create projects.");
    }

    const createdProject = await db.transaction(async (tx) => {
      const [project] = await tx
        .insert(projects)
        .values({
          companyId: user.companyId,
          createdByUserId: user.id,
          updatedByUserId: user.id,
          name: input.name.trim(),
          address: input.address.trim(),
          status: input.status,
          description: normalizeOptionalText(input.description),
          projectCode: normalizeOptionalText(input.projectCode),
          dateStarted: input.dateStarted,
          estimatedCompletionDate: input.estimatedCompletionDate,
          totalConcretePoured: "0",
          estimatedTotalConcrete: String(input.estimatedTotalConcrete),
        })
        .returning({ id: projects.id });

      if (!project) {
        throw new Error("Unable to create the project right now.");
      }

      await tx.insert(projectMembers).values({
        projectId: project.id,
        userId: user.id,
        role: "project_admin",
      });

      await recordProjectActivity(tx, {
        actionType: "project_created",
        details: {
          name: input.name.trim(),
          status: input.status,
        },
        projectId: project.id,
        summary: `Project created: ${input.name.trim()}`,
        userId: user.id,
      });

      return project;
    });

    return success({ id: createdProject.id }, "Project created.");
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    if (
      error instanceof Error &&
      (error.message === "Authentication required." ||
        error.message === "Tenant access required.")
    ) {
      return failure("unauthorized", "You must be signed in to create a project.");
    }

    const databaseFailure = getProjectWriteFailure(error, "create");
    if (databaseFailure) {
      return databaseFailure;
    }

    return failure("create_project_failed", "Unable to create the project right now.");
  }
}

export async function updateProject(
  projectId: string,
  rawInput: UpdateProjectInput
): Promise<ActionResult<{ id: string }>> {
  try {
    assertSameOrigin();
    const input = updateProjectSchema.parse(rawInput);
    const access = await requireProjectAccess(projectId, "edit");
    const { user } = access;
    const project = await requireOwnedProject(access.context.project.companyId, projectId);
    const [buildingCountRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projectBuildings)
      .where(eq(projectBuildings.projectId, projectId));
    const isHierarchyManaged = (buildingCountRow?.count ?? 0) > 0;

    if (!isHierarchyManaged && input.estimatedTotalConcrete < toNumber(project.totalConcretePoured)) {
      return failure("validation_error", "Please fix the highlighted fields.", {
        estimatedTotalConcrete:
          "Estimated total concrete must remain at or above the current total poured.",
      });
    }

    await db.transaction(async (tx) => {
      await tx
        .update(projects)
        .set({
          updatedByUserId: user.id,
          name: input.name.trim(),
          address: input.address.trim(),
          status: input.status,
          description: normalizeOptionalText(input.description),
          projectCode: normalizeOptionalText(input.projectCode),
          dateStarted: input.dateStarted,
          estimatedCompletionDate: input.estimatedCompletionDate,
          estimatedTotalConcrete: isHierarchyManaged
            ? project.estimatedTotalConcrete
            : String(input.estimatedTotalConcrete),
        })
        .where(eq(projects.id, projectId));

      await recordProjectActivity(tx, {
        actionType: "project_updated",
        details: {
          name: input.name.trim(),
          status: input.status,
        },
        projectId,
        summary: `Project updated: ${input.name.trim()}`,
        userId: user.id,
      });
    });

    return success({ id: projectId }, "Project updated.");
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    if (
      error instanceof Error &&
      (error.message === "Authentication required." ||
        error.message === "Tenant access required.")
    ) {
      return failure("unauthorized", "You must be signed in to update this project.");
    }

    const databaseFailure = getProjectWriteFailure(error, "update");
    if (databaseFailure) {
      return databaseFailure;
    }

    return failure("update_project_failed", "Unable to update the project right now.");
  }
}

export async function deleteProject(
  rawInput: unknown
): Promise<ActionResult<{ redirectTo: "/dashboard/projects" }>> {
  try {
    assertSameOrigin();
    const { projectId } = deleteProjectSchema.parse(rawInput);
    const access = await requireProjectAccess(projectId, "delete");
    const user = access.user;
    const project = await requireOwnedProject(access.context.project.companyId, projectId);

    const projectFiles = await db
      .select({
        storagePath: attachments.storagePath,
      })
      .from(attachments)
      .where(eq(attachments.projectId, projectId));

    await db.transaction(async (tx) => {
      await recordProjectActivity(tx, {
        actionType: "project_deleted",
        details: {
          name: project.name,
          status: project.status,
        },
        projectId: project.id,
        summary: `Project deleted: ${project.name}`,
        userId: user.id,
      });

      await tx.delete(projects).where(eq(projects.id, project.id));
    });

    await Promise.all(projectFiles.map((attachment) => deleteStoredFile(attachment.storagePath)));

    return success({ redirectTo: "/dashboard/projects" }, "Project deleted.");
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Unable to delete the requested project.");
    }

    if (
      error instanceof Error &&
      (error.message === "Authentication required." ||
        error.message === "Tenant access required.")
    ) {
      return failure("unauthorized", "You must be signed in to delete this project.");
    }

    return failure("delete_project_failed", "Unable to delete the project right now.");
  }
}

export async function requireOwnedProject(companyId: string, projectId: string) {
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.companyId, companyId)),
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  return project;
}

export async function refreshProjectAggregateTotals(
  transaction: AppTransaction | AppDatabase,
  projectId: string
) {
  await transaction.execute(sql`select public.refresh_project_rollups(${projectId}::uuid)`);

  return transaction.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });
}

export async function recordProjectActivity(
  transaction: AppTransaction | AppDatabase,
  input: {
    projectId: string;
    userId: string;
    actionType: string;
    details: Record<string, unknown>;
    summary?: string;
    pourId?: string;
  }
) {
  const project = await transaction.query.projects.findFirst({
    where: eq(projects.id, input.projectId),
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  await recordActivityEvent(transaction, {
    companyId: project.companyId,
    projectId: input.projectId,
    actorUserId: input.userId,
    entityType: input.pourId ? "pour" : "project",
    entityId: input.pourId ?? input.projectId,
    eventType: input.actionType,
    summary: input.summary ?? input.actionType.replaceAll("_", " "),
    metadata: input.details,
  });
}

function buildProjectFilters(
  companyId: string,
  accessibleProjectIds: string[],
  input: ProjectListQuery
) {
  const filters = [eq(projects.companyId, companyId), inArray(projects.id, accessibleProjectIds)];
  const searchValue = input.q?.trim();

  if (searchValue) {
    const pattern = `%${searchValue}%`;
    filters.push(
      or(
        like(projects.name, pattern),
        like(projects.address, pattern),
        like(projects.projectCode, pattern)
      )!
    );
  }

  if (input.status && input.status !== "all") {
    filters.push(eq(projects.status, input.status));
  }

  if (input.progress && input.progress !== "all") {
    if (input.progress === "not_started") {
      filters.push(eq(projects.totalConcretePoured, "0"));
    }

    if (input.progress === "in_progress") {
      filters.push(sql`${projects.totalConcretePoured} > 0`);
      filters.push(sql`${projects.totalConcretePoured} < ${projects.estimatedTotalConcrete}`);
    }

    if (input.progress === "complete") {
      filters.push(sql`${projects.estimatedTotalConcrete} > 0`);
      filters.push(sql`${projects.totalConcretePoured} >= ${projects.estimatedTotalConcrete}`);
    }
  }

  if (input.startDateFrom) {
    filters.push(gte(projects.dateStarted, input.startDateFrom));
  }

  if (input.startDateTo) {
    filters.push(lte(projects.dateStarted, input.startDateTo));
  }

  if (input.estimatedDateFrom) {
    filters.push(gte(projects.estimatedCompletionDate, input.estimatedDateFrom));
  }

  if (input.estimatedDateTo) {
    filters.push(lte(projects.estimatedCompletionDate, input.estimatedDateTo));
  }

  return filters;
}

function getProjectOrderBy(input: ProjectListQuery) {
  const direction = input.sortDir === "asc" ? asc : desc;
  const sortColumn = {
    dateStarted: projects.dateStarted,
    estimatedCompletionDate: projects.estimatedCompletionDate,
    estimatedTotalConcrete: projects.estimatedTotalConcrete,
    name: projects.name,
    totalConcretePoured: projects.totalConcretePoured,
    updatedAt: projects.updatedAt,
  }[input.sortBy];

  return [direction(sortColumn), direction(projects.id)] as const;
}

function summarizeActivity(
  summary: string,
  actionType: string,
  detailsJson: Record<string, unknown> | null
) {
  const details = detailsJson ?? {};

  if (summary) {
    return summary;
  }

  switch (actionType) {
    case "project_created":
      return `Project created${details.name ? `: ${String(details.name)}` : ""}`;
    case "project_updated":
      return `Project updated${details.name ? `: ${String(details.name)}` : ""}`;
    case "pour_event_created":
      return `Pour event added${details.locationDescription ? ` for ${String(details.locationDescription)}` : ""}`;
    case "pour_event_updated":
      return `Pour event updated${details.locationDescription ? ` for ${String(details.locationDescription)}` : ""}`;
    case "pour_event_deleted":
      return `Pour event deleted${details.locationDescription ? ` from ${String(details.locationDescription)}` : ""}`;
    case "attachment_uploaded":
      return `Attachment uploaded${details.originalFileName ? `: ${String(details.originalFileName)}` : ""}`;
    case "attachment_deleted":
      return `Attachment deleted${details.originalFileName ? `: ${String(details.originalFileName)}` : ""}`;
    default:
      return actionType.replaceAll("_", " ");
  }
}
