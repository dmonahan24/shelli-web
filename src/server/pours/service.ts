import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  like,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { ZodError } from "zod";
import { db } from "@/db";
import { loadTickets, mixDesigns, pours, users } from "@/db/schema";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { requireProjectAccess } from "@/lib/auth/project-access";
import {
  createPourEventSchema,
  deletePourEventSchema,
  pourEventListQuerySchema,
  updatePourEventSchema,
  type CreatePourEventInput,
  type PourEventListQuery,
  type UpdatePourEventInput,
} from "@/lib/validation/pour-event";
import { failure, success, type ActionResult } from "@/lib/utils/action-result";
import {
  recordProjectActivity,
  refreshProjectAggregateTotals,
  requireOwnedProject,
} from "@/server/projects/service";

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

export async function listProjectPours(projectId: string, rawInput?: unknown) {
  await requireProjectAccess(projectId, "view");

  const input = pourEventListQuerySchema.parse(rawInput ?? {});
  const filters = buildPourFilters(projectId, input);
  const whereClause = and(...filters);
  const orderByClauses = getPourOrderBy(input);
  const offset = (input.page - 1) * input.pageSize;

  const [baseRows, totalCountRows] = await Promise.all([
    db
      .select({
        id: pours.id,
        projectId: pours.projectId,
        pourDate: pours.scheduledDate,
        concreteAmount: pours.actualVolume,
        unit: pours.unit,
        locationDescription: pours.placementAreaLabel,
        mixType: mixDesigns.name,
        weatherNotes: pours.weatherNotes,
        crewNotes: pours.notes,
        createdAt: pours.createdAt,
        updatedAt: pours.updatedAt,
        createdBy: users.fullName,
      })
      .from(pours)
      .leftJoin(users, eq(pours.createdByUserId, users.id))
      .leftJoin(mixDesigns, eq(pours.mixDesignId, mixDesigns.id))
      .where(whereClause)
      .orderBy(...orderByClauses)
      .limit(input.pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(pours)
      .where(whereClause),
  ]);

  const pourIds = baseRows.map((row) => row.id);
  const ticketRows =
    pourIds.length > 0
      ? await db
          .select({
            id: loadTickets.id,
            pourId: loadTickets.pourId,
            supplierName: loadTickets.supplierName,
            ticketNumber: loadTickets.ticketNumber,
            createdAt: loadTickets.createdAt,
          })
          .from(loadTickets)
          .where(inArray(loadTickets.pourId, pourIds))
          .orderBy(desc(loadTickets.createdAt))
      : [];

  const firstTicketByPour = new Map<string, (typeof ticketRows)[number]>();
  for (const ticketRow of ticketRows) {
    if (!firstTicketByPour.has(ticketRow.pourId)) {
      firstTicketByPour.set(ticketRow.pourId, ticketRow);
    }
  }

  const totalCount = totalCountRows[0]?.count ?? 0;

  return {
    rows: baseRows.map((row) => {
      const ticket = firstTicketByPour.get(row.id);
      return {
        ...row,
        concreteAmount: toNumber(row.concreteAmount),
        supplierName: ticket?.supplierName ?? null,
        ticketNumber: ticket?.ticketNumber ?? null,
        createdBy: row.createdBy ?? "System",
      };
    }),
    totalCount,
    page: input.page,
    pageSize: input.pageSize,
    pageCount: Math.max(1, Math.ceil(totalCount / input.pageSize)),
  };
}

export async function createPourEvent(
  rawInput: CreatePourEventInput
): Promise<
  ActionResult<{
    id: string;
    projectId: string;
  }>
> {
  try {
    assertSameOrigin();
    const input = createPourEventSchema.parse(rawInput);
    const access = await requireProjectAccess(input.projectId, "edit");
    const { user } = access;
    const project = await requireOwnedProject(access.context.project.companyId, input.projectId);

    const [createdPour] = await db
      .insert(pours)
      .values({
        companyId: user.companyId,
        projectId: project.id,
        createdByUserId: user.id,
        updatedByUserId: user.id,
        scheduledDate: input.pourDate,
        placementAreaLabel: input.locationDescription.trim(),
        placementAreaType: "other",
        status: "completed",
        unit: input.unit,
        mixDesignLabel: normalizeOptionalText(input.mixType),
        actualVolume: String(input.concreteAmount),
        deliveredVolume: String(input.concreteAmount),
        weatherNotes: normalizeOptionalText(input.weatherNotes),
        notes: normalizeOptionalText(input.crewNotes),
      })
      .returning({ id: pours.id });

    if (!createdPour) {
      return failure("create_pour_event_failed", "Unable to add the pour event right now.");
    }

    if (input.ticketNumber || input.supplierName) {
      await db.insert(loadTickets).values({
        companyId: user.companyId,
        projectId: project.id,
        pourId: createdPour.id,
        createdByUserId: user.id,
        updatedByUserId: user.id,
        ticketNumber: normalizeOptionalText(input.ticketNumber),
        supplierName: normalizeOptionalText(input.supplierName),
        quantity: String(input.concreteAmount),
        status: "accepted",
      });
    }

    await refreshProjectAggregateTotals(db, project.id);
    await recordProjectActivity(db, {
      actionType: "pour_event_created",
      details: {
        concreteAmount: input.concreteAmount,
        locationDescription: input.locationDescription.trim(),
        pourDate: input.pourDate,
      },
      projectId: project.id,
      pourId: createdPour.id,
      summary: `Pour event added for ${input.locationDescription.trim()}`,
      userId: user.id,
    });

    const message =
      project.status === "completed"
        ? "Pour event added. This project is marked completed, so review its status if needed."
        : "Pour event added.";

    return success({ id: createdPour.id, projectId: project.id }, message);
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    if (
      error instanceof Error &&
      (error.message === "Authentication required." ||
        error.message === "Tenant access required.")
    ) {
      return failure("unauthorized", "You must be signed in to add a pour event.");
    }

    return failure("create_pour_event_failed", "Unable to add the pour event right now.");
  }
}

export async function updatePourEvent(
  rawInput: UpdatePourEventInput
): Promise<ActionResult<{ id: string; projectId: string }>> {
  try {
    assertSameOrigin();
    const input = updatePourEventSchema.parse(rawInput);
    const access = await requireProjectAccess(input.projectId, "edit");
    const user = access.user;
    const pourEvent = await requireOwnedPourEvent(access.context.project.companyId, input.id);

    await db
      .update(pours)
      .set({
        updatedByUserId: user.id,
        scheduledDate: input.pourDate,
        actualVolume: String(input.concreteAmount),
        deliveredVolume: String(input.concreteAmount),
        unit: input.unit,
        mixDesignLabel: normalizeOptionalText(input.mixType),
        placementAreaLabel: input.locationDescription.trim(),
        weatherNotes: normalizeOptionalText(input.weatherNotes),
        notes: normalizeOptionalText(input.crewNotes),
      })
      .where(eq(pours.id, input.id));

    const existingTicket = await db.query.loadTickets.findFirst({
      where: eq(loadTickets.pourId, input.id),
      orderBy: (table, operators) => [operators.desc(table.createdAt)],
    });

    if (existingTicket) {
      await db
        .update(loadTickets)
        .set({
          updatedByUserId: user.id,
          ticketNumber: normalizeOptionalText(input.ticketNumber),
          supplierName: normalizeOptionalText(input.supplierName),
          quantity: String(input.concreteAmount),
        })
        .where(eq(loadTickets.id, existingTicket.id));
    } else if (input.ticketNumber || input.supplierName) {
      await db.insert(loadTickets).values({
        companyId: user.companyId,
        projectId: pourEvent.projectId,
        pourId: input.id,
        createdByUserId: user.id,
        updatedByUserId: user.id,
        ticketNumber: normalizeOptionalText(input.ticketNumber),
        supplierName: normalizeOptionalText(input.supplierName),
        quantity: String(input.concreteAmount),
        status: "accepted",
      });
    }

    await refreshProjectAggregateTotals(db, pourEvent.projectId);
    await recordProjectActivity(db, {
      actionType: "pour_event_updated",
      details: {
        concreteAmount: input.concreteAmount,
        locationDescription: input.locationDescription.trim(),
        pourDate: input.pourDate,
      },
      projectId: pourEvent.projectId,
      pourId: input.id,
      summary: `Pour event updated for ${input.locationDescription.trim()}`,
      userId: user.id,
    });

    return success(
      { id: input.id, projectId: pourEvent.projectId },
      "Pour event updated."
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    if (
      error instanceof Error &&
      (error.message === "Authentication required." ||
        error.message === "Tenant access required.")
    ) {
      return failure("unauthorized", "You must be signed in to update a pour event.");
    }

    return failure("update_pour_event_failed", "Unable to update the pour event right now.");
  }
}

export async function deletePourEvent(
  rawInput: unknown
): Promise<ActionResult<{ id: string; projectId: string }>> {
  try {
    assertSameOrigin();
    const { id } = deletePourEventSchema.parse(rawInput);
    const pourEvent = await requireOwnedPourEventById(id);
    const access = await requireProjectAccess(pourEvent.projectId, "edit");
    const user = access.user;

    await db.delete(pours).where(eq(pours.id, id));
    await refreshProjectAggregateTotals(db, pourEvent.projectId);
    await recordProjectActivity(db, {
      actionType: "pour_event_deleted",
      details: {
        concreteAmount: toNumber(pourEvent.actualVolume),
        locationDescription: pourEvent.placementAreaLabel,
        pourDate: pourEvent.scheduledDate,
      },
      projectId: pourEvent.projectId,
      pourId: id,
      summary: `Pour event deleted from ${pourEvent.placementAreaLabel}`,
      userId: user.id,
    });

    return success({ id, projectId: pourEvent.projectId }, "Pour event deleted.");
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Unable to delete the requested pour event.");
    }

    if (
      error instanceof Error &&
      (error.message === "Authentication required." ||
        error.message === "Tenant access required.")
    ) {
      return failure("unauthorized", "You must be signed in to delete a pour event.");
    }

    return failure("delete_pour_event_failed", "Unable to delete the pour event right now.");
  }
}

async function requireOwnedPourEvent(companyId: string, pourEventId: string) {
  const pourEvent = await db.query.pours.findFirst({
    where: and(eq(pours.id, pourEventId), eq(pours.companyId, companyId)),
  });

  if (!pourEvent) {
    throw new Error("Pour event not found.");
  }

  return pourEvent;
}

async function requireOwnedPourEventById(pourEventId: string) {
  const pourEvent = await db.query.pours.findFirst({
    where: eq(pours.id, pourEventId),
  });

  if (!pourEvent) {
    throw new Error("Pour event not found.");
  }

  return pourEvent;
}

function buildPourFilters(projectId: string, input: PourEventListQuery) {
  const filters = [eq(pours.projectId, projectId)];
  const searchValue = input.q?.trim();

  if (searchValue) {
    const pattern = `%${searchValue}%`;
    filters.push(
      or(
        like(pours.placementAreaLabel, pattern),
        like(pours.weatherNotes, pattern),
        like(pours.notes, pattern)
      )!
    );
  }

  if (input.dateFrom) {
    filters.push(gte(pours.scheduledDate, input.dateFrom));
  }

  if (input.dateTo) {
    filters.push(lte(pours.scheduledDate, input.dateTo));
  }

  if (typeof input.minAmount === "number") {
    filters.push(gte(pours.actualVolume, String(input.minAmount)));
  }

  if (typeof input.maxAmount === "number") {
    filters.push(lte(pours.actualVolume, String(input.maxAmount)));
  }

  return filters;
}

function getPourOrderBy(input: PourEventListQuery) {
  const direction = input.sortDir === "asc" ? asc : desc;
  const sortColumn = input.sortBy === "concreteAmount" ? pours.actualVolume : pours.scheduledDate;

  return [direction(sortColumn), direction(pours.id)] as const;
}
