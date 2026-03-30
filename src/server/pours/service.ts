import { randomUUID } from "node:crypto";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  like,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { ZodError } from "zod";
import { db } from "@/db";
import { concretePourEvents, projects, users } from "@/db/schema";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { requireUser } from "@/lib/auth/session";
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

export async function listProjectPours(projectId: string, rawInput?: unknown) {
  const user = await requireUser();
  await requireOwnedProject(user.id, projectId);

  const input = pourEventListQuerySchema.parse(rawInput ?? {});
  const filters = buildPourFilters(projectId, input);
  const whereClause = and(...filters);
  const orderByClauses = getPourOrderBy(input);
  const offset = (input.page - 1) * input.pageSize;

  const [rows, totalCountRows] = await Promise.all([
    db
      .select({
        id: concretePourEvents.id,
        projectId: concretePourEvents.projectId,
        pourDate: concretePourEvents.pourDate,
        concreteAmount: concretePourEvents.concreteAmount,
        unit: concretePourEvents.unit,
        locationDescription: concretePourEvents.locationDescription,
        mixType: concretePourEvents.mixType,
        supplierName: concretePourEvents.supplierName,
        ticketNumber: concretePourEvents.ticketNumber,
        weatherNotes: concretePourEvents.weatherNotes,
        crewNotes: concretePourEvents.crewNotes,
        createdAt: concretePourEvents.createdAt,
        updatedAt: concretePourEvents.updatedAt,
        createdBy: users.fullName,
      })
      .from(concretePourEvents)
      .innerJoin(users, eq(concretePourEvents.userId, users.id))
      .where(whereClause)
      .orderBy(...orderByClauses)
      .limit(input.pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(concretePourEvents)
      .where(whereClause),
  ]);

  const totalCount = totalCountRows[0]?.count ?? 0;

  return {
    rows,
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
    const user = await requireUser();
    const input = createPourEventSchema.parse(rawInput);
    const project = await requireOwnedProject(user.id, input.projectId);
    const pourEventId = randomUUID();

    await db.transaction(async (transaction) => {
      await transaction.insert(concretePourEvents).values({
        id: pourEventId,
        projectId: project.id,
        userId: user.id,
        pourDate: input.pourDate,
        concreteAmount: input.concreteAmount,
        unit: input.unit,
        locationDescription: input.locationDescription.trim(),
        mixType: normalizeOptionalText(input.mixType),
        supplierName: normalizeOptionalText(input.supplierName),
        ticketNumber: normalizeOptionalText(input.ticketNumber),
        weatherNotes: normalizeOptionalText(input.weatherNotes),
        crewNotes: normalizeOptionalText(input.crewNotes),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await refreshProjectAggregateTotals(transaction, project.id);
      await recordProjectActivity(transaction, {
        actionType: "pour_event_created",
        details: {
          concreteAmount: input.concreteAmount,
          locationDescription: input.locationDescription.trim(),
          pourDate: input.pourDate,
        },
        projectId: project.id,
        userId: user.id,
      });
    });

    const message =
      project.status === "completed"
        ? "Pour event added. This project is marked completed, so review its status if needed."
        : "Pour event added.";

    return success({ id: pourEventId, projectId: project.id }, message);
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    if (error instanceof Error && error.message === "Authentication required.") {
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
    const user = await requireUser();
    const input = updatePourEventSchema.parse(rawInput);
    const pourEvent = await requireOwnedPourEvent(user.id, input.id);

    await db.transaction(async (transaction) => {
      await transaction
        .update(concretePourEvents)
        .set({
          pourDate: input.pourDate,
          concreteAmount: input.concreteAmount,
          unit: input.unit,
          locationDescription: input.locationDescription.trim(),
          mixType: normalizeOptionalText(input.mixType),
          supplierName: normalizeOptionalText(input.supplierName),
          ticketNumber: normalizeOptionalText(input.ticketNumber),
          weatherNotes: normalizeOptionalText(input.weatherNotes),
          crewNotes: normalizeOptionalText(input.crewNotes),
          updatedAt: new Date(),
        })
        .where(eq(concretePourEvents.id, input.id));

      await refreshProjectAggregateTotals(transaction, pourEvent.projectId);
      await recordProjectActivity(transaction, {
        actionType: "pour_event_updated",
        details: {
          concreteAmount: input.concreteAmount,
          locationDescription: input.locationDescription.trim(),
          pourDate: input.pourDate,
        },
        projectId: pourEvent.projectId,
        userId: user.id,
      });
    });

    return success(
      { id: input.id, projectId: pourEvent.projectId },
      "Pour event updated."
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    if (error instanceof Error && error.message === "Authentication required.") {
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
    const user = await requireUser();
    const { id } = deletePourEventSchema.parse(rawInput);
    const pourEvent = await requireOwnedPourEvent(user.id, id);

    await db.transaction(async (transaction) => {
      await transaction.delete(concretePourEvents).where(eq(concretePourEvents.id, id));
      await refreshProjectAggregateTotals(transaction, pourEvent.projectId);
      await recordProjectActivity(transaction, {
        actionType: "pour_event_deleted",
        details: {
          concreteAmount: pourEvent.concreteAmount,
          locationDescription: pourEvent.locationDescription,
          pourDate: pourEvent.pourDate,
        },
        projectId: pourEvent.projectId,
        userId: user.id,
      });
    });

    return success({ id, projectId: pourEvent.projectId }, "Pour event deleted.");
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Unable to delete the requested pour event.");
    }

    if (error instanceof Error && error.message === "Authentication required.") {
      return failure("unauthorized", "You must be signed in to delete a pour event.");
    }

    return failure("delete_pour_event_failed", "Unable to delete the pour event right now.");
  }
}

async function requireOwnedPourEvent(userId: string, pourEventId: string) {
  const pourEvent = await db
    .select({
      id: concretePourEvents.id,
      projectId: concretePourEvents.projectId,
      pourDate: concretePourEvents.pourDate,
      concreteAmount: concretePourEvents.concreteAmount,
      locationDescription: concretePourEvents.locationDescription,
    })
    .from(concretePourEvents)
    .innerJoin(projects, eq(concretePourEvents.projectId, projects.id))
    .where(and(eq(concretePourEvents.id, pourEventId), eq(projects.userId, userId)))
    .then((rows) => rows[0] ?? null);

  if (!pourEvent) {
    throw new Error("Pour event not found.");
  }

  return pourEvent;
}

function buildPourFilters(projectId: string, input: PourEventListQuery) {
  const filters = [eq(concretePourEvents.projectId, projectId)];
  const searchValue = input.q?.trim();

  if (searchValue) {
    const pattern = `%${searchValue}%`;
    filters.push(
      or(
        like(concretePourEvents.ticketNumber, pattern),
        like(concretePourEvents.locationDescription, pattern),
        like(concretePourEvents.supplierName, pattern),
        like(concretePourEvents.mixType, pattern)
      )!
    );
  }

  if (input.dateFrom) {
    filters.push(gte(concretePourEvents.pourDate, input.dateFrom));
  }

  if (input.dateTo) {
    filters.push(lte(concretePourEvents.pourDate, input.dateTo));
  }

  if (typeof input.minAmount === "number") {
    filters.push(gte(concretePourEvents.concreteAmount, input.minAmount));
  }

  if (typeof input.maxAmount === "number") {
    filters.push(lte(concretePourEvents.concreteAmount, input.maxAmount));
  }

  return filters;
}

function getPourOrderBy(input: PourEventListQuery) {
  const direction = input.sortDir === "asc" ? asc : desc;
  const sortColumn =
    input.sortBy === "concreteAmount"
      ? concretePourEvents.concreteAmount
      : concretePourEvents.pourDate;

  return [direction(sortColumn), direction(concretePourEvents.id)] as const;
}
