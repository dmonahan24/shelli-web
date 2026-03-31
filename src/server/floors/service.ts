import { and, asc, eq, ne, sql } from "drizzle-orm";
import { ZodError } from "zod";
import { db } from "@/db";
import { buildingFloors, floorPourTypes, projectBuildings, projects } from "@/db/schema";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { getDefaultFloorDisplayOrder, getDefaultFloorName, getRemainingConcrete } from "@/lib/hierarchy";
import {
  bulkCreateFloorsSchema,
  createFloorSchema,
  deleteFloorSchema,
  updateFloorSchema,
  type BulkCreateFloorsInput,
  type CreateFloorInput,
  type UpdateFloorInput,
} from "@/lib/validation/floor";
import { failure, success, type ActionResult } from "@/lib/utils/action-result";
import { recalculateHierarchyFromFloor } from "@/server/hierarchy/recalculate-from-floor";
import { requireOwnedBuilding, requireOwnedFloor, toNumber, zodFieldErrors } from "@/server/hierarchy/shared";
import { recordActivityEvent } from "@/server/activity/service";
import { requireProjectAccess } from "@/lib/auth/project-access";

function getFloorWriteFailure(error: unknown) {
  const databaseError =
    error && typeof error === "object"
      ? (error as { code?: string; constraint_name?: string; constraint?: string; message?: string })
      : null;

  const constraintName = databaseError?.constraint_name ?? databaseError?.constraint ?? "";
  const message = databaseError?.message ?? "";

  if (
    databaseError?.code === "23505" &&
    (constraintName === "building_floors_building_name_idx" ||
      message.includes("building_floors_building_name_idx"))
  ) {
    return failure("validation_error", "Please fix the highlighted fields.", {
      customName: "A floor with that name already exists in this building.",
    });
  }

  if (
    databaseError?.code === "23505" &&
    (constraintName === "building_floors_foundation_unique_idx" ||
      message.includes("building_floors_foundation_unique_idx"))
  ) {
    return failure("validation_error", "Please fix the highlighted fields.", {
      floorType: "This building already has a Foundation floor.",
    });
  }

  if (
    databaseError?.code === "23505" &&
    (constraintName === "building_floors_ground_unique_idx" ||
      message.includes("building_floors_ground_unique_idx"))
  ) {
    return failure("validation_error", "Please fix the highlighted fields.", {
      floorType: "This building already has a Ground Level floor.",
    });
  }

  if (
    databaseError?.code === "23505" &&
    (constraintName === "building_floors_standard_level_unique_idx" ||
      message.includes("building_floors_standard_level_unique_idx"))
  ) {
    return failure("validation_error", "Please fix the highlighted fields.", {
      levelNumber: "This building already has that standard level.",
    });
  }

  return null;
}

async function validateFloorUniqueness(
  input: {
    buildingId: string;
    floorType: "foundation" | "ground" | "standard" | "basement" | "roof" | "other";
    levelNumber?: number;
    name: string;
    excludeFloorId?: string;
  }
): Promise<Record<string, string> | null> {
  const whereClauses = [eq(buildingFloors.buildingId, input.buildingId)];

  if (input.excludeFloorId) {
    whereClauses.push(ne(buildingFloors.id, input.excludeFloorId));
  }

  const existingFloors = await db.query.buildingFloors.findMany({
    where: and(...whereClauses),
  });

  if (existingFloors.some((floor) => floor.name.toLowerCase() === input.name.toLowerCase())) {
    return {
      customName: "A floor with that name already exists in this building.",
    };
  }

  if (input.floorType === "foundation" && existingFloors.some((floor) => floor.floorType === "foundation")) {
    return {
      floorType: "This building already has a Foundation floor.",
    };
  }

  if (input.floorType === "ground" && existingFloors.some((floor) => floor.floorType === "ground")) {
    return {
      floorType: "This building already has a Ground Level floor.",
    };
  }

  if (
    input.floorType === "standard" &&
    existingFloors.some(
      (floor) => floor.floorType === "standard" && floor.levelNumber === input.levelNumber
    )
  ) {
    return {
      levelNumber: "This building already has that standard level.",
    };
  }

  return null;
}

async function getFloorRowsForBuilding(buildingId: string) {
  const rows = await db
    .select({
      id: buildingFloors.id,
      projectId: buildingFloors.projectId,
      buildingId: buildingFloors.buildingId,
      name: buildingFloors.name,
      floorType: buildingFloors.floorType,
      levelNumber: buildingFloors.levelNumber,
      displayOrder: buildingFloors.displayOrder,
      estimatedConcreteTotal: buildingFloors.estimatedConcreteTotal,
      actualConcreteTotal: buildingFloors.actualConcreteTotal,
      updatedAt: buildingFloors.updatedAt,
      pourTypeCount: sql<number>`count(${floorPourTypes.id})`,
      completedPourTypeCount: sql<number>`count(*) filter (where ${floorPourTypes.status} = 'completed')`,
      inProgressPourTypeCount: sql<number>`count(*) filter (where ${floorPourTypes.status} = 'in_progress')`,
    })
    .from(buildingFloors)
    .leftJoin(floorPourTypes, eq(floorPourTypes.floorId, buildingFloors.id))
    .where(eq(buildingFloors.buildingId, buildingId))
    .groupBy(
      buildingFloors.id,
      buildingFloors.projectId,
      buildingFloors.buildingId,
      buildingFloors.name,
      buildingFloors.floorType,
      buildingFloors.levelNumber,
      buildingFloors.displayOrder,
      buildingFloors.estimatedConcreteTotal,
      buildingFloors.actualConcreteTotal,
      buildingFloors.updatedAt
    )
    .orderBy(asc(buildingFloors.displayOrder), asc(buildingFloors.name));

  return rows.map((row) => {
    const estimatedConcreteTotal = toNumber(row.estimatedConcreteTotal);
    const actualConcreteTotal = toNumber(row.actualConcreteTotal);
    return {
      ...row,
      estimatedConcreteTotal,
      actualConcreteTotal,
      remainingConcrete: getRemainingConcrete(estimatedConcreteTotal, actualConcreteTotal),
    };
  });
}

export async function listFloorsForBuilding(buildingId: string) {
  const building = await db.query.projectBuildings.findFirst({
    where: eq(projectBuildings.id, buildingId),
  });

  if (!building) {
    return [];
  }

  const access = await requireProjectAccess(building.projectId, "view");
  await requireOwnedBuilding(access.context.project.companyId, buildingId);

  return getFloorRowsForBuilding(buildingId);
}

export async function getFloorDetail(floorId: string) {
  const floor = await db.query.buildingFloors.findFirst({
    where: eq(buildingFloors.id, floorId),
  });

  if (!floor) {
    return null;
  }

  const access = await requireProjectAccess(floor.projectId, "view");
  await requireOwnedFloor(access.context.project.companyId, floorId);

  const [project, building, pourTypes] = await Promise.all([
    db.query.projects.findFirst({
      where: eq(projects.id, floor.projectId),
    }),
    db.query.projectBuildings.findFirst({
      where: eq(projectBuildings.id, floor.buildingId),
    }),
    db.query.floorPourTypes.findMany({
      where: eq(floorPourTypes.floorId, floorId),
      orderBy: [asc(floorPourTypes.displayOrder), asc(floorPourTypes.name)],
    }),
  ]);

  if (!project || !building) {
    return null;
  }

  const floorEstimatedConcrete = toNumber(floor.estimatedConcreteTotal);
  const floorActualConcrete = toNumber(floor.actualConcreteTotal);
  const pourTypeRows = pourTypes.map((pourType) => {
    const estimatedConcrete = toNumber(pourType.estimatedConcrete);
    const actualConcrete = toNumber(pourType.actualConcrete);

    return {
      ...pourType,
      estimatedConcrete,
      actualConcrete,
      remainingConcrete: getRemainingConcrete(estimatedConcrete, actualConcrete),
    };
  });

  return {
    floor: {
      ...floor,
      estimatedConcreteTotal: floorEstimatedConcrete,
      actualConcreteTotal: floorActualConcrete,
      remainingConcrete: getRemainingConcrete(floorEstimatedConcrete, floorActualConcrete),
    },
    building: {
      id: building.id,
      name: building.name,
    },
    project: {
      id: project.id,
      name: project.name,
    },
    pourTypes: pourTypeRows,
    summary: {
      totalPourTypes: pourTypeRows.length,
      completedPourTypesCount: pourTypeRows.filter((pourType) => pourType.status === "completed")
        .length,
      inProgressPourTypesCount: pourTypeRows.filter(
        (pourType) => pourType.status === "in_progress"
      ).length,
    },
  };
}

export async function createFloor(
  rawInput: CreateFloorInput
): Promise<ActionResult<{ id: string; buildingId: string; projectId: string }>> {
  try {
    assertSameOrigin();
    const input = createFloorSchema.parse(rawInput);
    const building = await db.query.projectBuildings.findFirst({
      where: eq(projectBuildings.id, input.buildingId),
    });

    if (!building) {
      return failure("not_found", "Building not found.");
    }

    const access = await requireProjectAccess(building.projectId, "edit");
    await requireOwnedBuilding(access.context.project.companyId, building.id);

    const name = getDefaultFloorName(input.floorType, input.levelNumber, input.customName);
    const uniquenessErrors = await validateFloorUniqueness({
      buildingId: building.id,
      floorType: input.floorType,
      levelNumber: input.levelNumber,
      name,
    });

    if (uniquenessErrors) {
      return failure("validation_error", "Please fix the highlighted fields.", uniquenessErrors);
    }

    const displayOrder =
      input.displayOrder ?? getDefaultFloorDisplayOrder(input.floorType, input.levelNumber);

    const createdFloor = await db.transaction(async (tx) => {
      const [floor] = await tx
        .insert(buildingFloors)
        .values({
          projectId: building.projectId,
          buildingId: building.id,
          companyId: building.companyId,
          name,
          floorType: input.floorType,
          levelNumber: input.floorType === "standard" ? input.levelNumber ?? null : null,
          displayOrder,
          estimatedConcreteTotal: "0",
          actualConcreteTotal: "0",
        })
        .returning({ id: buildingFloors.id });

      if (!floor) {
        throw new Error("Unable to create the floor right now.");
      }

      await recalculateHierarchyFromFloor(
        {
          buildingId: building.id,
          projectId: building.projectId,
        },
        tx
      );

      await recordActivityEvent(tx, {
        companyId: building.companyId,
        projectId: building.projectId,
        actorUserId: access.user.id,
        eventType: "floor_created",
        entityType: "floor",
        entityId: floor.id,
        summary: `Floor ${name} created`,
        metadata: {
          buildingId: building.id,
          floorId: floor.id,
          floorType: input.floorType,
          levelNumber: input.levelNumber ?? null,
          name,
        },
      });

      return floor;
    });

    return success(
      {
        id: createdFloor.id,
        buildingId: building.id,
        projectId: building.projectId,
      },
      "Floor created."
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    const floorFailure = getFloorWriteFailure(error);
    if (floorFailure) {
      return floorFailure;
    }

    if (
      error instanceof Error &&
      (error.message === "Authentication required." ||
        error.message === "Tenant access required." ||
        error.message === "Project access required.")
    ) {
      return failure("unauthorized", "You do not have permission to create floors.");
    }

    return failure("create_floor_failed", "Unable to create the floor right now.");
  }
}

export async function updateFloor(
  rawInput: UpdateFloorInput
): Promise<ActionResult<{ id: string; buildingId: string; projectId: string }>> {
  try {
    assertSameOrigin();
    const input = updateFloorSchema.parse(rawInput);
    const floor = await db.query.buildingFloors.findFirst({
      where: eq(buildingFloors.id, input.floorId),
    });

    if (!floor) {
      return failure("not_found", "Floor not found.");
    }

    const access = await requireProjectAccess(floor.projectId, "edit");
    await requireOwnedFloor(access.context.project.companyId, floor.id);

    const name = getDefaultFloorName(input.floorType, input.levelNumber, input.customName);
    const uniquenessErrors = await validateFloorUniqueness({
      buildingId: floor.buildingId,
      floorType: input.floorType,
      levelNumber: input.levelNumber,
      name,
      excludeFloorId: floor.id,
    });

    if (uniquenessErrors) {
      return failure("validation_error", "Please fix the highlighted fields.", uniquenessErrors);
    }

    await db
      .update(buildingFloors)
      .set({
        name,
        floorType: input.floorType,
        levelNumber: input.floorType === "standard" ? input.levelNumber ?? null : null,
        displayOrder:
          input.displayOrder ?? getDefaultFloorDisplayOrder(input.floorType, input.levelNumber),
      })
      .where(eq(buildingFloors.id, floor.id));

    await recordActivityEvent(db, {
      companyId: floor.companyId,
      projectId: floor.projectId,
      actorUserId: access.user.id,
      eventType: "floor_updated",
      entityType: "floor",
      entityId: floor.id,
      summary: `Floor ${name} updated`,
      metadata: {
        buildingId: floor.buildingId,
        floorId: floor.id,
        floorType: input.floorType,
        levelNumber: input.levelNumber ?? null,
        name,
      },
    });

    return success(
      {
        id: floor.id,
        buildingId: floor.buildingId,
        projectId: floor.projectId,
      },
      "Floor updated."
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    const floorFailure = getFloorWriteFailure(error);
    if (floorFailure) {
      return floorFailure;
    }

    if (
      error instanceof Error &&
      (error.message === "Authentication required." ||
        error.message === "Tenant access required." ||
        error.message === "Project access required.")
    ) {
      return failure("unauthorized", "You do not have permission to update floors.");
    }

    return failure("update_floor_failed", "Unable to update the floor right now.");
  }
}

export async function deleteFloor(
  rawInput: unknown
): Promise<ActionResult<{ id: string; buildingId: string; projectId: string }>> {
  try {
    assertSameOrigin();
    const input = deleteFloorSchema.parse(rawInput);
    const floor = await db.query.buildingFloors.findFirst({
      where: eq(buildingFloors.id, input.floorId),
    });

    if (!floor) {
      return failure("not_found", "Floor not found.");
    }

    const access = await requireProjectAccess(floor.projectId, "edit");
    await requireOwnedFloor(access.context.project.companyId, floor.id);

    await db.transaction(async (tx) => {
      await recordActivityEvent(tx, {
        companyId: floor.companyId,
        projectId: floor.projectId,
        actorUserId: access.user.id,
        eventType: "floor_deleted",
        entityType: "floor",
        entityId: floor.id,
        summary: `Floor ${floor.name} deleted`,
        metadata: {
          buildingId: floor.buildingId,
          floorId: floor.id,
          name: floor.name,
        },
      });

      await tx.delete(buildingFloors).where(eq(buildingFloors.id, floor.id));
      await recalculateHierarchyFromFloor(
        {
          buildingId: floor.buildingId,
          projectId: floor.projectId,
        },
        tx
      );
    });

    return success(
      {
        id: floor.id,
        buildingId: floor.buildingId,
        projectId: floor.projectId,
      },
      "Floor deleted."
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Unable to delete the requested floor.");
    }

    if (
      error instanceof Error &&
      (error.message === "Authentication required." ||
        error.message === "Tenant access required." ||
        error.message === "Project access required.")
    ) {
      return failure("unauthorized", "You do not have permission to delete floors.");
    }

    return failure("delete_floor_failed", "Unable to delete the floor right now.");
  }
}

export async function bulkCreateFloors(
  rawInput: BulkCreateFloorsInput
): Promise<ActionResult<{ buildingId: string; projectId: string; createdCount: number }>> {
  try {
    assertSameOrigin();
    const input = bulkCreateFloorsSchema.parse(rawInput);
    const building = await db.query.projectBuildings.findFirst({
      where: eq(projectBuildings.id, input.buildingId),
    });

    if (!building) {
      return failure("not_found", "Building not found.");
    }

    const access = await requireProjectAccess(building.projectId, "edit");
    await requireOwnedBuilding(access.context.project.companyId, building.id);

    const pendingFloors: Array<{
      name: string;
      floorType: "foundation" | "ground" | "standard" | "basement" | "roof" | "other";
      levelNumber: number | null;
      displayOrder: number;
    }> = [];

    if (input.includeFoundation) {
      pendingFloors.push({
        name: getDefaultFloorName("foundation"),
        floorType: "foundation",
        levelNumber: null,
        displayOrder: getDefaultFloorDisplayOrder("foundation"),
      });
    }

    if (input.includeGroundLevel) {
      pendingFloors.push({
        name: getDefaultFloorName("ground"),
        floorType: "ground",
        levelNumber: null,
        displayOrder: getDefaultFloorDisplayOrder("ground"),
      });
    }

    const topLevel = input.topStandardLevel ?? 1;
    if (topLevel >= 2) {
      for (let levelNumber = 2; levelNumber <= topLevel; levelNumber += 1) {
        pendingFloors.push({
          name: getDefaultFloorName("standard", levelNumber),
          floorType: "standard",
          levelNumber,
          displayOrder: getDefaultFloorDisplayOrder("standard", levelNumber),
        });
      }
    }

    if (pendingFloors.length === 0) {
      return failure("validation_error", "Choose at least one floor to create.");
    }

    const existingFloors = await db.query.buildingFloors.findMany({
      where: eq(buildingFloors.buildingId, building.id),
    });

    for (const pendingFloor of pendingFloors) {
      if (
        existingFloors.some(
          (floor) =>
            floor.floorType === pendingFloor.floorType &&
            (pendingFloor.floorType !== "standard" || floor.levelNumber === pendingFloor.levelNumber)
        )
      ) {
        return failure("validation_error", `Floor ${pendingFloor.name} already exists.`);
      }
    }

    await db.transaction(async (tx) => {
      await tx.insert(buildingFloors).values(
        pendingFloors.map((floor) => ({
          projectId: building.projectId,
          buildingId: building.id,
          companyId: building.companyId,
          name: floor.name,
          floorType: floor.floorType,
          levelNumber: floor.levelNumber,
          displayOrder: floor.displayOrder,
          estimatedConcreteTotal: "0",
          actualConcreteTotal: "0",
        }))
      );

      await recalculateHierarchyFromFloor(
        {
          buildingId: building.id,
          projectId: building.projectId,
        },
        tx
      );

      await recordActivityEvent(tx, {
        companyId: building.companyId,
        projectId: building.projectId,
        actorUserId: access.user.id,
        eventType: "floor_created",
        entityType: "building",
        entityId: building.id,
        summary: `${pendingFloors.length} floor${pendingFloors.length === 1 ? "" : "s"} created for ${building.name}`,
        metadata: {
          buildingId: building.id,
          createdCount: pendingFloors.length,
          floors: pendingFloors,
        },
      });
    });

    return success(
      {
        buildingId: building.id,
        projectId: building.projectId,
        createdCount: pendingFloors.length,
      },
      `${pendingFloors.length} floor${pendingFloors.length === 1 ? "" : "s"} created.`
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
      return failure("unauthorized", "You do not have permission to create floors.");
    }

    return failure("bulk_create_floors_failed", "Unable to create floors right now.");
  }
}

export async function getFloorDeleteSummary(floorId: string) {
  const floor = await db.query.buildingFloors.findFirst({
    where: eq(buildingFloors.id, floorId),
  });

  if (!floor) {
    return null;
  }

  const access = await requireProjectAccess(floor.projectId, "view");
  await requireOwnedFloor(access.context.project.companyId, floor.id);

  const [summary] = await db
    .select({
      pourTypeCount: sql<number>`count(${floorPourTypes.id})`,
    })
    .from(buildingFloors)
    .leftJoin(floorPourTypes, eq(floorPourTypes.floorId, buildingFloors.id))
    .where(eq(buildingFloors.id, floorId))
    .groupBy(buildingFloors.id);

  const estimatedConcreteTotal = toNumber(floor.estimatedConcreteTotal);
  const actualConcreteTotal = toNumber(floor.actualConcreteTotal);

  return {
    floor: {
      id: floor.id,
      name: floor.name,
      buildingId: floor.buildingId,
      projectId: floor.projectId,
    },
    summary: {
      pourTypeCount: summary?.pourTypeCount ?? 0,
      estimatedConcreteTotal,
      actualConcreteTotal,
      remainingConcrete: getRemainingConcrete(estimatedConcreteTotal, actualConcreteTotal),
    },
  };
}
