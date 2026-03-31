import { and, asc, eq, sql } from "drizzle-orm";
import { ZodError } from "zod";
import { db } from "@/db";
import { buildingFloors, floorPourTypes, projectBuildings, projects } from "@/db/schema";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { getRemainingConcrete } from "@/lib/hierarchy";
import {
  createBuildingSchema,
  deleteBuildingSchema,
  updateBuildingSchema,
  type CreateBuildingInput,
  type UpdateBuildingInput,
} from "@/lib/validation/building";
import { failure, success, type ActionResult } from "@/lib/utils/action-result";
import { recalculateProjectTotals } from "@/server/hierarchy/recalculate-project-totals";
import { normalizeOptionalText, requireOwnedBuilding, toNumber, zodFieldErrors } from "@/server/hierarchy/shared";
import { recordActivityEvent } from "@/server/activity/service";
import { requireOwnedProject } from "@/server/projects/service";
import { requireProjectAccess } from "@/lib/auth/project-access";

function getBuildingWriteFailure(error: unknown) {
  const databaseError =
    error && typeof error === "object"
      ? (error as { code?: string; constraint_name?: string; constraint?: string; message?: string })
      : null;

  const constraintName = databaseError?.constraint_name ?? databaseError?.constraint ?? "";
  const message = databaseError?.message ?? "";

  if (
    databaseError?.code === "23505" &&
    (constraintName === "project_buildings_project_name_idx" ||
      message.includes("project_buildings_project_name_idx"))
  ) {
    return failure("validation_error", "Please fix the highlighted fields.", {
      name: "A building with that name already exists in this project.",
    });
  }

  return null;
}

async function getNextBuildingDisplayOrder(projectId: string) {
  const [row] = await db
    .select({
      maxDisplayOrder: sql<number>`coalesce(max(${projectBuildings.displayOrder}), 0)`,
    })
    .from(projectBuildings)
    .where(eq(projectBuildings.projectId, projectId));

  return (row?.maxDisplayOrder ?? 0) + 10;
}

function deriveFloorStatus(row: {
  completedPourTypeCount: number;
  inProgressPourTypeCount: number;
  pourTypeCount: number;
}) {
  if (row.pourTypeCount === 0) {
    return "not_started" as const;
  }

  if (row.completedPourTypeCount === row.pourTypeCount) {
    return "completed" as const;
  }

  if (row.inProgressPourTypeCount > 0 || row.completedPourTypeCount > 0) {
    return "in_progress" as const;
  }

  return "not_started" as const;
}

async function getFloorsForBuilding(buildingId: string) {
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
      status: deriveFloorStatus(row),
    };
  });
}

export async function listBuildingsForProject(projectId: string) {
  await requireProjectAccess(projectId, "view");

  const rows = await db
    .select({
      id: projectBuildings.id,
      projectId: projectBuildings.projectId,
      name: projectBuildings.name,
      code: projectBuildings.code,
      description: projectBuildings.description,
      displayOrder: projectBuildings.displayOrder,
      estimatedConcreteTotal: projectBuildings.estimatedConcreteTotal,
      actualConcreteTotal: projectBuildings.actualConcreteTotal,
      updatedAt: projectBuildings.updatedAt,
      floorCount: sql<number>`count(distinct ${buildingFloors.id})`,
      pourTypeCount: sql<number>`count(${floorPourTypes.id})`,
    })
    .from(projectBuildings)
    .leftJoin(buildingFloors, eq(buildingFloors.buildingId, projectBuildings.id))
    .leftJoin(floorPourTypes, eq(floorPourTypes.floorId, buildingFloors.id))
    .where(eq(projectBuildings.projectId, projectId))
    .groupBy(
      projectBuildings.id,
      projectBuildings.projectId,
      projectBuildings.name,
      projectBuildings.code,
      projectBuildings.description,
      projectBuildings.displayOrder,
      projectBuildings.estimatedConcreteTotal,
      projectBuildings.actualConcreteTotal,
      projectBuildings.updatedAt
    )
    .orderBy(asc(projectBuildings.displayOrder), asc(projectBuildings.name));

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

export async function getBuildingDetail(buildingId: string) {
  const building = await db.query.projectBuildings.findFirst({
    where: eq(projectBuildings.id, buildingId),
  });

  if (!building) {
    return null;
  }

  const access = await requireProjectAccess(building.projectId, "view");
  if (access.context.project.companyId !== building.companyId) {
    throw new Error("Project access required.");
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, building.projectId),
  });

  if (!project) {
    return null;
  }

  const floors = await getFloorsForBuilding(buildingId);
  const completedFloorsCount = floors.filter((floor) => floor.status === "completed").length;
  const inProgressFloorsCount = floors.filter((floor) => floor.status === "in_progress").length;
  const estimatedConcreteTotal = toNumber(building.estimatedConcreteTotal);
  const actualConcreteTotal = toNumber(building.actualConcreteTotal);

  return {
    building: {
      ...building,
      estimatedConcreteTotal,
      actualConcreteTotal,
      remainingConcrete: getRemainingConcrete(estimatedConcreteTotal, actualConcreteTotal),
    },
    floors,
    project: {
      id: project.id,
      name: project.name,
    },
    summary: {
      totalFloors: floors.length,
      completedFloorsCount,
      inProgressFloorsCount,
    },
  };
}

export async function createBuilding(
  rawInput: CreateBuildingInput
): Promise<ActionResult<{ id: string; projectId: string }>> {
  try {
    assertSameOrigin();
    const input = createBuildingSchema.parse(rawInput);
    const access = await requireProjectAccess(input.projectId, "edit");
    const project = await requireOwnedProject(access.context.project.companyId, input.projectId);
    const displayOrder = input.displayOrder ?? (await getNextBuildingDisplayOrder(project.id));

    const createdBuilding = await db.transaction(async (tx) => {
      const [building] = await tx
        .insert(projectBuildings)
        .values({
          projectId: project.id,
          companyId: project.companyId,
          name: input.name.trim(),
          code: normalizeOptionalText(input.code),
          description: normalizeOptionalText(input.description),
          displayOrder,
          estimatedConcreteTotal: "0",
          actualConcreteTotal: "0",
        })
        .returning({ id: projectBuildings.id });

      if (!building) {
        throw new Error("Unable to create the building right now.");
      }

      await recalculateProjectTotals(project.id, tx);
      await recordActivityEvent(tx, {
        companyId: project.companyId,
        projectId: project.id,
        actorUserId: access.user.id,
        eventType: "building_created",
        entityType: "building",
        entityId: building.id,
        summary: `Building ${input.name.trim()} created`,
        metadata: {
          buildingId: building.id,
          name: input.name.trim(),
        },
      });

      return building;
    });

    return success({ id: createdBuilding.id, projectId: project.id }, "Building created.");
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    const buildingFailure = getBuildingWriteFailure(error);
    if (buildingFailure) {
      return buildingFailure;
    }

    if (
      error instanceof Error &&
      (error.message === "Authentication required." ||
        error.message === "Tenant access required." ||
        error.message === "Project access required.")
    ) {
      return failure("unauthorized", "You do not have permission to create buildings.");
    }

    return failure("create_building_failed", "Unable to create the building right now.");
  }
}

export async function updateBuilding(
  rawInput: UpdateBuildingInput
): Promise<ActionResult<{ id: string; projectId: string }>> {
  try {
    assertSameOrigin();
    const input = updateBuildingSchema.parse(rawInput);
    const building = await db.query.projectBuildings.findFirst({
      where: eq(projectBuildings.id, input.buildingId),
    });

    if (!building) {
      return failure("not_found", "Building not found.");
    }

    const access = await requireProjectAccess(building.projectId, "edit");
    await requireOwnedBuilding(access.context.project.companyId, input.buildingId);

    await db
      .update(projectBuildings)
      .set({
        name: input.name.trim(),
        code: normalizeOptionalText(input.code),
        description: normalizeOptionalText(input.description),
        displayOrder: input.displayOrder ?? building.displayOrder,
      })
      .where(eq(projectBuildings.id, input.buildingId));

    await recordActivityEvent(db, {
      companyId: building.companyId,
      projectId: building.projectId,
      actorUserId: access.user.id,
      eventType: "building_updated",
      entityType: "building",
      entityId: building.id,
      summary: `Building ${input.name.trim()} updated`,
      metadata: {
        buildingId: building.id,
        name: input.name.trim(),
      },
    });

    return success({ id: building.id, projectId: building.projectId }, "Building updated.");
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    const buildingFailure = getBuildingWriteFailure(error);
    if (buildingFailure) {
      return buildingFailure;
    }

    if (
      error instanceof Error &&
      (error.message === "Authentication required." ||
        error.message === "Tenant access required." ||
        error.message === "Project access required.")
    ) {
      return failure("unauthorized", "You do not have permission to update buildings.");
    }

    return failure("update_building_failed", "Unable to update the building right now.");
  }
}

export async function deleteBuilding(
  rawInput: unknown
): Promise<ActionResult<{ id: string; projectId: string }>> {
  try {
    assertSameOrigin();
    const input = deleteBuildingSchema.parse(rawInput);
    const building = await db.query.projectBuildings.findFirst({
      where: eq(projectBuildings.id, input.buildingId),
    });

    if (!building) {
      return failure("not_found", "Building not found.");
    }

    const access = await requireProjectAccess(building.projectId, "edit");
    await requireOwnedBuilding(access.context.project.companyId, input.buildingId);

    await db.transaction(async (tx) => {
      await recordActivityEvent(tx, {
        companyId: building.companyId,
        projectId: building.projectId,
        actorUserId: access.user.id,
        eventType: "building_deleted",
        entityType: "building",
        entityId: building.id,
        summary: `Building ${building.name} deleted`,
        metadata: {
          buildingId: building.id,
          name: building.name,
        },
      });

      await tx.delete(projectBuildings).where(eq(projectBuildings.id, building.id));
      await recalculateProjectTotals(building.projectId, tx);
    });

    return success({ id: building.id, projectId: building.projectId }, "Building deleted.");
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Unable to delete the requested building.");
    }

    if (
      error instanceof Error &&
      (error.message === "Authentication required." ||
        error.message === "Tenant access required." ||
        error.message === "Project access required.")
    ) {
      return failure("unauthorized", "You do not have permission to delete buildings.");
    }

    return failure("delete_building_failed", "Unable to delete the building right now.");
  }
}

export async function getBuildingDeleteSummary(buildingId: string) {
  const building = await db.query.projectBuildings.findFirst({
    where: eq(projectBuildings.id, buildingId),
  });

  if (!building) {
    return null;
  }

  const access = await requireProjectAccess(building.projectId, "view");
  await requireOwnedBuilding(access.context.project.companyId, buildingId);

  const [summary] = await db
    .select({
      floorCount: sql<number>`count(distinct ${buildingFloors.id})`,
      pourTypeCount: sql<number>`count(${floorPourTypes.id})`,
    })
    .from(projectBuildings)
    .leftJoin(buildingFloors, eq(buildingFloors.buildingId, projectBuildings.id))
    .leftJoin(floorPourTypes, eq(floorPourTypes.floorId, buildingFloors.id))
    .where(eq(projectBuildings.id, buildingId));

  const estimatedConcreteTotal = toNumber(building.estimatedConcreteTotal);
  const actualConcreteTotal = toNumber(building.actualConcreteTotal);

  return {
    building: {
      id: building.id,
      name: building.name,
      projectId: building.projectId,
    },
    summary: {
      floorCount: summary?.floorCount ?? 0,
      pourTypeCount: summary?.pourTypeCount ?? 0,
      estimatedConcreteTotal,
      actualConcreteTotal,
      remainingConcrete: getRemainingConcrete(estimatedConcreteTotal, actualConcreteTotal),
    },
  };
}
