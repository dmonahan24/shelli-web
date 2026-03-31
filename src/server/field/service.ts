import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { ZodError } from "zod";
import { db } from "@/db";
import { attachments, loadTickets, pours, projects } from "@/db/schema";
import type { TenantUserPrincipal } from "@/lib/auth/principal";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { listAccessibleProjectIds, requireProjectAccess } from "@/lib/auth/project-access";
import { requireTenantUser } from "@/lib/auth/session";
import { measureRequestSpan } from "@/lib/server/request-context";
import {
  fieldAttachmentUploadSchema,
  quickPourSchema,
  type QuickPourInput,
} from "@/lib/validation/field";
import { failure, success, type ActionResult } from "@/lib/utils/action-result";
import { buildDocumentationTasks, calculateRemainingConcrete } from "@/server/analytics/calculations";
import { uploadProjectAttachment } from "@/server/attachments/service";
import { listRecentActivity, recordActivityEvent } from "@/server/activity/service";
import { ensureHumanFriendlyUrlSchema } from "@/server/navigation/schema-compat";
import { refreshProjectAggregateTotals } from "@/server/projects/service";

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

function toNumber(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  return value ? Number(value) : 0;
}

async function listFieldProjects(
  user: Pick<TenantUserPrincipal, "id" | "companyId" | "role">,
  limit: number
) {
  await ensureHumanFriendlyUrlSchema();
  const projectIds = await listAccessibleProjectIds(user, user.companyId);

  if (projectIds.length === 0) {
    return [];
  }

  return db
    .select({
      id: projects.id,
      name: projects.name,
      slug: projects.slug,
      status: projects.status,
      estimatedTotalConcrete: projects.estimatedTotalConcrete,
      totalConcretePoured: projects.totalConcretePoured,
      lastPourDate: projects.lastPourDate,
    })
    .from(projects)
    .where(and(eq(projects.companyId, user.companyId), inArray(projects.id, projectIds)))
    .orderBy(desc(projects.updatedAt))
    .limit(limit);
}

async function buildFieldDocumentationTasks(
  companyId: string,
  projectRows: Array<{
    id: string;
    name: string;
    slug: string | null;
    status: string;
    estimatedTotalConcrete: string | number | null;
    totalConcretePoured: string | number | null;
    lastPourDate: string | null;
  }>
) {
  if (projectRows.length === 0) {
    return [];
  }

  const projectIds = projectRows.map((project) => project.id);
  const [pourCountRows, attachmentCountRows] = await Promise.all([
    db
      .select({
        projectId: pours.projectId,
        count: sql<number>`count(*)`,
      })
      .from(pours)
      .where(and(eq(pours.companyId, companyId), inArray(pours.projectId, projectIds)))
      .groupBy(pours.projectId),
    db
      .select({
        projectId: attachments.projectId,
        attachmentType: attachments.attachmentType,
        count: sql<number>`count(*)`,
      })
      .from(attachments)
      .where(and(eq(attachments.companyId, companyId), inArray(attachments.projectId, projectIds)))
      .groupBy(attachments.projectId, attachments.attachmentType),
  ]);

  const pourCountByProjectId = new Map(
    pourCountRows.map((row) => [row.projectId, row.count])
  );
  const attachmentCountsByProjectId = new Map<
    string,
    {
      photoCount: number;
      ticketCount: number;
    }
  >();

  for (const row of attachmentCountRows) {
    const current = attachmentCountsByProjectId.get(row.projectId) ?? {
      photoCount: 0,
      ticketCount: 0,
    };

    if (row.attachmentType === "photo") {
      current.photoCount = row.count;
    }

    if (row.attachmentType === "delivery_ticket") {
      current.ticketCount = row.count;
    }

    attachmentCountsByProjectId.set(row.projectId, current);
  }

  return projectRows.flatMap((project) =>
    buildDocumentationTasks({
      projectName: project.name,
      recentPourCount: pourCountByProjectId.get(project.id) ?? 0,
      recentPhotoCount: attachmentCountsByProjectId.get(project.id)?.photoCount ?? 0,
      recentTicketCount: attachmentCountsByProjectId.get(project.id)?.ticketCount ?? 0,
    }).map((task) => ({
      ...task,
      projectId: project.id,
    }))
  );
}

export async function getFieldHomeCriticalData(
  user?: Pick<TenantUserPrincipal, "id" | "companyId" | "role">
) {
  const resolvedUser = user ?? (await requireTenantUser());

  return measureRequestSpan(
    "field.home_critical",
    async () => {
      const projectRows = await listFieldProjects(resolvedUser, 8);
      const documentationTasks = await buildFieldDocumentationTasks(
        resolvedUser.companyId,
        projectRows
      );

      return {
        projects: projectRows.map((project) => ({
          ...project,
          remainingConcrete: calculateRemainingConcrete(
            toNumber(project.totalConcretePoured),
            toNumber(project.estimatedTotalConcrete)
          ),
        })),
        documentationTasks,
      };
    },
    {
      details: (result) => ({
        projects: result.projects.length,
        tasks: result.documentationTasks.length,
      }),
    }
  );
}

export async function getFieldHomeDeferredData(
  user?: Pick<TenantUserPrincipal, "id" | "companyId" | "role">
) {
  const resolvedUser = user ?? (await requireTenantUser());

  return measureRequestSpan(
    "field.home_deferred",
    async () => ({
      recentActivity: await listRecentActivity({
        companyId: resolvedUser.companyId,
        limit: 6,
      }),
    }),
    {
      details: (result) => ({
        recentActivity: result.recentActivity.length,
      }),
    }
  );
}

export async function getFieldHomeData() {
  const user = await requireTenantUser();
  const [critical, deferred] = await Promise.all([
    getFieldHomeCriticalData(user),
    getFieldHomeDeferredData(user),
  ]);

  return {
    ...critical,
    ...deferred,
  };
}

export async function getFieldProjectDetail(projectId: string) {
  const access = await requireProjectAccess(projectId, "view");
  await ensureHumanFriendlyUrlSchema();
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

  if (!project) {
    return null;
  }

  const [recentPours, recentUploads, recentActivity] = await Promise.all([
    db
      .select({
        id: pours.id,
        scheduledDate: pours.scheduledDate,
        placementAreaLabel: pours.placementAreaLabel,
        actualVolume: pours.actualVolume,
      })
      .from(pours)
      .where(eq(pours.projectId, projectId))
      .orderBy(desc(pours.scheduledDate))
      .limit(5),
    db
      .select({
        id: attachments.id,
        originalFileName: attachments.originalFileName,
        attachmentType: attachments.attachmentType,
        createdAt: attachments.createdAt,
      })
      .from(attachments)
      .where(eq(attachments.projectId, projectId))
      .orderBy(desc(attachments.createdAt))
      .limit(5),
    listRecentActivity({
      companyId: access.context.project.companyId,
      projectId,
      limit: 6,
    }),
  ]);

  const documentationTasks = buildDocumentationTasks({
    projectName: project.name,
    recentPourCount: recentPours.length,
    recentPhotoCount: recentUploads.filter((upload) => upload.attachmentType === "photo").length,
    recentTicketCount: recentUploads.filter((upload) => upload.attachmentType === "delivery_ticket").length,
  });

  return {
    project: {
      ...project,
      remainingConcrete: calculateRemainingConcrete(
        toNumber(project.totalConcretePoured),
        toNumber(project.estimatedTotalConcrete)
      ),
    },
    recentPours: recentPours.map((pour) => ({
      ...pour,
      actualVolume: toNumber(pour.actualVolume),
    })),
    recentUploads,
    recentActivity,
    documentationTasks,
  };
}

export async function createQuickPour(
  rawInput: QuickPourInput
): Promise<ActionResult<{ id: string; projectId: string }>> {
  try {
    assertSameOrigin();
    const input = quickPourSchema.parse(rawInput);
    const access = await requireProjectAccess(input.projectId, "edit");

    const existing = await db.query.pours.findFirst({
      where: and(
        eq(pours.projectId, input.projectId),
        eq(pours.createdByUserId, access.user.id),
        eq(pours.clientSubmissionId, input.clientSubmissionId)
      ),
    });

    if (existing) {
      return failure("duplicate_submission", "This pour was already submitted from this device.");
    }

    const [pour] = await db
      .insert(pours)
      .values({
        companyId: access.context.project.companyId,
        projectId: input.projectId,
        createdByUserId: access.user.id,
        updatedByUserId: access.user.id,
        scheduledDate: input.pourDate,
        placementAreaType: "other",
        placementAreaLabel: input.locationDescription.trim(),
        mixDesignLabel: normalizeOptionalText(input.mixType),
        status: "completed",
        unit: "cubic_yards",
        actualVolume: String(input.concreteAmount),
        deliveredVolume: String(input.concreteAmount),
        clientSubmissionId: input.clientSubmissionId,
        notes: normalizeOptionalText(input.crewNotes),
        weatherNotes: normalizeOptionalText(input.weatherNotes),
      })
      .returning({ id: pours.id });

    if (!pour) {
      return failure("create_quick_pour_failed", "Unable to save the pour right now.");
    }

    if (input.ticketNumber || input.supplierName) {
      await db.insert(loadTickets).values({
        companyId: access.context.project.companyId,
        projectId: input.projectId,
        pourId: pour.id,
        createdByUserId: access.user.id,
        updatedByUserId: access.user.id,
        ticketNumber: normalizeOptionalText(input.ticketNumber),
        supplierName: normalizeOptionalText(input.supplierName),
        quantity: String(input.concreteAmount),
        status: "accepted",
      });
    }

    await refreshProjectAggregateTotals(db, input.projectId);
    await recordActivityEvent(db, {
      companyId: access.context.project.companyId,
      projectId: input.projectId,
      actorUserId: access.user.id,
      eventType: "pour_created",
      entityType: "pour",
      entityId: pour.id,
      summary: `Quick pour added for ${input.locationDescription.trim()}`,
      metadata: {
        concreteAmount: input.concreteAmount,
        locationDescription: input.locationDescription.trim(),
      },
    });

    return success({ id: pour.id, projectId: input.projectId }, "Quick pour saved.");
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    return failure("create_quick_pour_failed", "Unable to save the pour right now.");
  }
}

export async function uploadFieldAttachment(
  formData: FormData
): Promise<ActionResult<{ projectId: string; uploadedCount: number }>> {
  try {
    assertSameOrigin();
    fieldAttachmentUploadSchema.parse({
      projectId: formData.get("projectId"),
      attachmentType: formData.get("attachmentType"),
      caption: formData.get("caption"),
    });

    return uploadProjectAttachment(formData);
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    return failure("upload_attachment_failed", "Unable to upload the file right now.");
  }
}
