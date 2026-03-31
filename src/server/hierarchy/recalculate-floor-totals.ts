import { eq, sql } from "drizzle-orm";
import { db, type AppDatabase, type AppTransaction } from "@/db";
import { buildingFloors, floorPourTypes } from "@/db/schema";

export async function recalculateFloorTotals(
  floorId: string,
  transaction: AppTransaction | AppDatabase = db
) {
  const [totals] = await transaction
    .select({
      estimatedConcreteTotal: sql<string>`coalesce(sum(${floorPourTypes.estimatedConcrete}), 0)`,
      actualConcreteTotal: sql<string>`coalesce(sum(${floorPourTypes.actualConcrete}), 0)`,
    })
    .from(floorPourTypes)
    .where(eq(floorPourTypes.floorId, floorId));

  await transaction
    .update(buildingFloors)
    .set({
      estimatedConcreteTotal: totals?.estimatedConcreteTotal ?? "0",
      actualConcreteTotal: totals?.actualConcreteTotal ?? "0",
    })
    .where(eq(buildingFloors.id, floorId));

  return transaction.query.buildingFloors.findFirst({
    where: eq(buildingFloors.id, floorId),
  });
}
