import { eq, sql } from "drizzle-orm";
import { db, type AppDatabase, type AppTransaction } from "@/db";
import { buildingFloors, projectBuildings } from "@/db/schema";

export async function recalculateBuildingTotals(
  buildingId: string,
  transaction: AppTransaction | AppDatabase = db
) {
  const [totals] = await transaction
    .select({
      estimatedConcreteTotal: sql<string>`coalesce(sum(${buildingFloors.estimatedConcreteTotal}), 0)`,
      actualConcreteTotal: sql<string>`coalesce(sum(${buildingFloors.actualConcreteTotal}), 0)`,
    })
    .from(buildingFloors)
    .where(eq(buildingFloors.buildingId, buildingId));

  await transaction
    .update(projectBuildings)
    .set({
      estimatedConcreteTotal: totals?.estimatedConcreteTotal ?? "0",
      actualConcreteTotal: totals?.actualConcreteTotal ?? "0",
    })
    .where(eq(projectBuildings.id, buildingId));

  return transaction.query.projectBuildings.findFirst({
    where: eq(projectBuildings.id, buildingId),
  });
}
