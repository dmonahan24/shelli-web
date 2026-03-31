import { and, eq } from "drizzle-orm";
import { ZodError } from "zod";
import { db } from "@/db";
import { buildingFloors, floorPourTypes, projectBuildings } from "@/db/schema";

export function zodFieldErrors(error: ZodError) {
  const flattened = error.flatten().fieldErrors;
  return Object.fromEntries(
    Object.entries(flattened)
      .map(([key, value]) => [key, value?.[0]])
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
}

export function normalizeOptionalText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function toNumber(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  return value ? Number(value) : 0;
}

export async function requireOwnedBuilding(companyId: string, buildingId: string) {
  const building = await db.query.projectBuildings.findFirst({
    where: and(eq(projectBuildings.id, buildingId), eq(projectBuildings.companyId, companyId)),
  });

  if (!building) {
    throw new Error("Building not found.");
  }

  return building;
}

export async function requireOwnedFloor(companyId: string, floorId: string) {
  const floor = await db.query.buildingFloors.findFirst({
    where: and(eq(buildingFloors.id, floorId), eq(buildingFloors.companyId, companyId)),
  });

  if (!floor) {
    throw new Error("Floor not found.");
  }

  return floor;
}

export async function requireOwnedPourType(companyId: string, pourTypeId: string) {
  const pourType = await db.query.floorPourTypes.findFirst({
    where: and(eq(floorPourTypes.id, pourTypeId), eq(floorPourTypes.companyId, companyId)),
  });

  if (!pourType) {
    throw new Error("Pour type not found.");
  }

  return pourType;
}
