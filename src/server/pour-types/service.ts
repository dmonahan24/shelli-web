import { asc, eq, sql } from "drizzle-orm";
import { ZodError } from "zod";
import { db } from "@/db";
import { buildingFloors, floorPourTypes, projectBuildings } from "@/db/schema";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { getRemainingConcrete } from "@/lib/hierarchy";
import {
  applyPourTypePresetBundleSchema,
  createPourTypeSchema,
  deletePourTypeSchema,
  updatePourTypeSchema,
  type ApplyPourTypePresetBundleInput,
  type CreatePourTypeInput,
  type UpdatePourTypeInput,
} from "@/lib/validation/pour-type";
import { pourTypePresetBundles } from "@/lib/hierarchy";
import { failure, success, type ActionResult } from "@/lib/utils/action-result";
import { requireProjectAccess } from "@/lib/auth/project-access";
import { recalculateHierarchyFromPourType } from "@/server/hierarchy/recalculate-from-pour-type";
import { normalizeOptionalText, requireOwnedFloor, requireOwnedPourType, toNumber, zodFieldErrors } from "@/server/hierarchy/shared";
import { recordActivityEvent } from "@/server/activity/service";

function getPourTypeWriteFailure(error: unknown) {
  const databaseError =
    error && typeof error === "object"
      ? (error as { code?: string; constraint_name?: string; constraint?: string; message?: string })
      : null;

  const constraintName = databaseError?.constraint_name ?? databaseError?.constraint ?? "";
  const message = databaseError?.message ?? "";

  if (
    databaseError?.code === "23505" &&
    (constraintName === "floor_pour_types_floor_name_idx" ||
      message.includes("floor_pour_types_floor_name_idx"))
  ) {
    return failure("validation_error", "Please fix the highlighted fields.", {
      name: "A pour type with that name already exists on this floor.",
    });
  }

  return null;
}

async function getNextPourTypeDisplayOrder(floorId: string) {
  const [row] = await db
    .select({
      maxDisplayOrder: sql<number>`coalesce(max(${floorPourTypes.displayOrder}), 0)`,
    })
    .from(floorPourTypes)
    .where(eq(floorPourTypes.floorId, floorId));

  return (row?.maxDisplayOrder ?? 0) + 10;
}

export async function listPourTypesForFloor(floorId: string) {
  const floor = await db.query.buildingFloors.findFirst({
    where: eq(buildingFloors.id, floorId),
  });

  if (!floor) {
    return [];
  }

  const access = await requireProjectAccess(floor.projectId, "view");
  await requireOwnedFloor(access.context.project.companyId, floor.id);

  const pourTypes = await db.query.floorPourTypes.findMany({
    where: eq(floorPourTypes.floorId, floorId),
    orderBy: [asc(floorPourTypes.displayOrder), asc(floorPourTypes.name)],
  });

  return pourTypes.map((pourType) => {
    const estimatedConcrete = toNumber(pourType.estimatedConcrete);
    const actualConcrete = toNumber(pourType.actualConcrete);

    return {
      ...pourType,
      estimatedConcrete,
      actualConcrete,
      remainingConcrete: getRemainingConcrete(estimatedConcrete, actualConcrete),
    };
  });
}

export async function createPourType(
  rawInput: CreatePourTypeInput
): Promise<ActionResult<{ id: string; floorId: string; buildingId: string; projectId: string }>> {
  try {
    assertSameOrigin();
    const input = createPourTypeSchema.parse(rawInput);
    const floor = await db.query.buildingFloors.findFirst({
      where: eq(buildingFloors.id, input.floorId),
    });

    if (!floor) {
      return failure("not_found", "Floor not found.");
    }

    const access = await requireProjectAccess(floor.projectId, "edit");
    await requireOwnedFloor(access.context.project.companyId, floor.id);
    const displayOrder = input.displayOrder ?? (await getNextPourTypeDisplayOrder(floor.id));

    const createdPourType = await db.transaction(async (tx) => {
      const [pourType] = await tx
        .insert(floorPourTypes)
        .values({
          projectId: floor.projectId,
          buildingId: floor.buildingId,
          floorId: floor.id,
          companyId: floor.companyId,
          name: input.name.trim(),
          pourCategory: input.pourCategory,
          estimatedConcrete: String(input.estimatedConcrete),
          actualConcrete: String(input.actualConcrete ?? 0),
          status: input.status,
          notes: normalizeOptionalText(input.notes),
          displayOrder,
        })
        .returning({ id: floorPourTypes.id });

      if (!pourType) {
        throw new Error("Unable to create the pour type right now.");
      }

      await recalculateHierarchyFromPourType(
        {
          floorId: floor.id,
          buildingId: floor.buildingId,
          projectId: floor.projectId,
        },
        tx
      );

      await recordActivityEvent(tx, {
        companyId: floor.companyId,
        projectId: floor.projectId,
        actorUserId: access.user.id,
        eventType: "pour_type_created",
        entityType: "pour_type",
        entityId: pourType.id,
        summary: `Pour type ${input.name.trim()} created`,
        metadata: {
          buildingId: floor.buildingId,
          floorId: floor.id,
          pourTypeId: pourType.id,
          name: input.name.trim(),
          pourCategory: input.pourCategory,
        },
      });

      return pourType;
    });

    return success(
      {
        id: createdPourType.id,
        floorId: floor.id,
        buildingId: floor.buildingId,
        projectId: floor.projectId,
      },
      "Pour type created."
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    const pourTypeFailure = getPourTypeWriteFailure(error);
    if (pourTypeFailure) {
      return pourTypeFailure;
    }

    if (
      error instanceof Error &&
      (error.message === "Authentication required." ||
        error.message === "Tenant access required." ||
        error.message === "Project access required.")
    ) {
      return failure("unauthorized", "You do not have permission to create pour types.");
    }

    return failure("create_pour_type_failed", "Unable to create the pour type right now.");
  }
}

export async function updatePourType(
  rawInput: UpdatePourTypeInput
): Promise<ActionResult<{ id: string; floorId: string; buildingId: string; projectId: string }>> {
  try {
    assertSameOrigin();
    const input = updatePourTypeSchema.parse(rawInput);
    const pourType = await db.query.floorPourTypes.findFirst({
      where: eq(floorPourTypes.id, input.pourTypeId),
    });

    if (!pourType) {
      return failure("not_found", "Pour type not found.");
    }

    const access = await requireProjectAccess(pourType.projectId, "edit");
    await requireOwnedPourType(access.context.project.companyId, pourType.id);

    await db.transaction(async (tx) => {
      await tx
        .update(floorPourTypes)
        .set({
          name: input.name.trim(),
          pourCategory: input.pourCategory,
          estimatedConcrete: String(input.estimatedConcrete),
          actualConcrete: String(input.actualConcrete ?? 0),
          status: input.status,
          notes: normalizeOptionalText(input.notes),
          displayOrder: input.displayOrder ?? pourType.displayOrder,
        })
        .where(eq(floorPourTypes.id, pourType.id));

      await recalculateHierarchyFromPourType(
        {
          floorId: pourType.floorId,
          buildingId: pourType.buildingId,
          projectId: pourType.projectId,
        },
        tx
      );

      await recordActivityEvent(tx, {
        companyId: pourType.companyId,
        projectId: pourType.projectId,
        actorUserId: access.user.id,
        eventType: "pour_type_updated",
        entityType: "pour_type",
        entityId: pourType.id,
        summary: `Pour type ${input.name.trim()} updated`,
        metadata: {
          buildingId: pourType.buildingId,
          floorId: pourType.floorId,
          pourTypeId: pourType.id,
          name: input.name.trim(),
          pourCategory: input.pourCategory,
        },
      });
    });

    return success(
      {
        id: pourType.id,
        floorId: pourType.floorId,
        buildingId: pourType.buildingId,
        projectId: pourType.projectId,
      },
      "Pour type updated."
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    const pourTypeFailure = getPourTypeWriteFailure(error);
    if (pourTypeFailure) {
      return pourTypeFailure;
    }

    if (
      error instanceof Error &&
      (error.message === "Authentication required." ||
        error.message === "Tenant access required." ||
        error.message === "Project access required.")
    ) {
      return failure("unauthorized", "You do not have permission to update pour types.");
    }

    return failure("update_pour_type_failed", "Unable to update the pour type right now.");
  }
}

export async function deletePourType(
  rawInput: unknown
): Promise<ActionResult<{ id: string; floorId: string; buildingId: string; projectId: string }>> {
  try {
    assertSameOrigin();
    const input = deletePourTypeSchema.parse(rawInput);
    const pourType = await db.query.floorPourTypes.findFirst({
      where: eq(floorPourTypes.id, input.pourTypeId),
    });

    if (!pourType) {
      return failure("not_found", "Pour type not found.");
    }

    const access = await requireProjectAccess(pourType.projectId, "edit");
    await requireOwnedPourType(access.context.project.companyId, pourType.id);

    await db.transaction(async (tx) => {
      await recordActivityEvent(tx, {
        companyId: pourType.companyId,
        projectId: pourType.projectId,
        actorUserId: access.user.id,
        eventType: "pour_type_deleted",
        entityType: "pour_type",
        entityId: pourType.id,
        summary: `Pour type ${pourType.name} deleted`,
        metadata: {
          buildingId: pourType.buildingId,
          floorId: pourType.floorId,
          pourTypeId: pourType.id,
          name: pourType.name,
        },
      });

      await tx.delete(floorPourTypes).where(eq(floorPourTypes.id, pourType.id));
      await recalculateHierarchyFromPourType(
        {
          floorId: pourType.floorId,
          buildingId: pourType.buildingId,
          projectId: pourType.projectId,
        },
        tx
      );
    });

    return success(
      {
        id: pourType.id,
        floorId: pourType.floorId,
        buildingId: pourType.buildingId,
        projectId: pourType.projectId,
      },
      "Pour type deleted."
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Unable to delete the requested pour type.");
    }

    if (
      error instanceof Error &&
      (error.message === "Authentication required." ||
        error.message === "Tenant access required." ||
        error.message === "Project access required.")
    ) {
      return failure("unauthorized", "You do not have permission to delete pour types.");
    }

    return failure("delete_pour_type_failed", "Unable to delete the pour type right now.");
  }
}

export async function applyPourTypePresetBundle(
  rawInput: ApplyPourTypePresetBundleInput
): Promise<
  ActionResult<{
    buildingId: string;
    createdCount: number;
    floorId: string;
    projectId: string;
    skippedCount: number;
  }>
> {
  try {
    assertSameOrigin();
    const input = applyPourTypePresetBundleSchema.parse(rawInput);
    const floor = await db.query.buildingFloors.findFirst({
      where: eq(buildingFloors.id, input.floorId),
    });

    if (!floor) {
      return failure("not_found", "Floor not found.");
    }

    const access = await requireProjectAccess(floor.projectId, "edit");
    await requireOwnedFloor(access.context.project.companyId, floor.id);

    const presets = pourTypePresetBundles[input.bundle];
    const existingPourTypes = await db.query.floorPourTypes.findMany({
      where: eq(floorPourTypes.floorId, floor.id),
      orderBy: [asc(floorPourTypes.displayOrder), asc(floorPourTypes.name)],
    });
    const existingNames = new Set(existingPourTypes.map((pourType) => pourType.name.toLowerCase()));
    const pendingPresets = presets.filter(
      (preset) => !existingNames.has(preset.name.toLowerCase())
    );
    const skippedCount = presets.length - pendingPresets.length;

    if (pendingPresets.length === 0) {
      return success(
        {
          buildingId: floor.buildingId,
          createdCount: 0,
          floorId: floor.id,
          projectId: floor.projectId,
          skippedCount,
        },
        "All preset pour types already exist on this floor."
      );
    }

    const nextDisplayOrder = await getNextPourTypeDisplayOrder(floor.id);

    await db.transaction(async (tx) => {
      await tx.insert(floorPourTypes).values(
        pendingPresets.map((preset, index) => ({
          projectId: floor.projectId,
          buildingId: floor.buildingId,
          floorId: floor.id,
          companyId: floor.companyId,
          name: preset.name,
          pourCategory: preset.pourCategory,
          estimatedConcrete: "0",
          actualConcrete: "0",
          status: "not_started" as const,
          notes: null,
          displayOrder: nextDisplayOrder + index * 10,
        }))
      );

      await recalculateHierarchyFromPourType(
        {
          floorId: floor.id,
          buildingId: floor.buildingId,
          projectId: floor.projectId,
        },
        tx
      );

      await recordActivityEvent(tx, {
        companyId: floor.companyId,
        projectId: floor.projectId,
        actorUserId: access.user.id,
        eventType: "pour_type_created",
        entityType: "floor",
        entityId: floor.id,
        summary: `${pendingPresets.length} preset pour type${pendingPresets.length === 1 ? "" : "s"} added to ${floor.name}`,
        metadata: {
          buildingId: floor.buildingId,
          bundle: input.bundle,
          createdCount: pendingPresets.length,
          floorId: floor.id,
          skippedCount,
        },
      });
    });

    return success(
      {
        buildingId: floor.buildingId,
        createdCount: pendingPresets.length,
        floorId: floor.id,
        projectId: floor.projectId,
        skippedCount,
      },
      `${pendingPresets.length} preset pour type${pendingPresets.length === 1 ? "" : "s"} added.`
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    if (
      error instanceof Error &&
      (error.message === "Authentication required." ||
        error.message === "Tenant access required." ||
        error.message === "Project access required.")
    ) {
      return failure("unauthorized", "You do not have permission to add preset pour types.");
    }

    return failure("apply_preset_bundle_failed", "Unable to add the preset pour types right now.");
  }
}

export async function getPourTypeDeleteSummary(pourTypeId: string) {
  const pourType = await db.query.floorPourTypes.findFirst({
    where: eq(floorPourTypes.id, pourTypeId),
  });

  if (!pourType) {
    return null;
  }

  const access = await requireProjectAccess(pourType.projectId, "view");
  await requireOwnedPourType(access.context.project.companyId, pourTypeId);

  const estimatedConcrete = toNumber(pourType.estimatedConcrete);
  const actualConcrete = toNumber(pourType.actualConcrete);

  return {
    pourType: {
      id: pourType.id,
      name: pourType.name,
      floorId: pourType.floorId,
      buildingId: pourType.buildingId,
      projectId: pourType.projectId,
    },
    summary: {
      estimatedConcrete,
      actualConcrete,
      remainingConcrete: getRemainingConcrete(estimatedConcrete, actualConcrete),
    },
  };
}
