import { db, type AppDatabase, type AppTransaction } from "@/db";
import { recalculateBuildingTotals } from "@/server/hierarchy/recalculate-building-totals";
import { recalculateFloorTotals } from "@/server/hierarchy/recalculate-floor-totals";
import { recalculateProjectTotals } from "@/server/hierarchy/recalculate-project-totals";

export async function recalculateHierarchyFromPourType(
  input: {
    floorId: string;
    buildingId: string;
    projectId: string;
  },
  transaction: AppTransaction | AppDatabase = db
) {
  await recalculateFloorTotals(input.floorId, transaction);
  await recalculateBuildingTotals(input.buildingId, transaction);
  return recalculateProjectTotals(input.projectId, transaction);
}
