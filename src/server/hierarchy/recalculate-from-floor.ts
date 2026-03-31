import { db, type AppDatabase, type AppTransaction } from "@/db";
import { recalculateBuildingTotals } from "@/server/hierarchy/recalculate-building-totals";
import { recalculateProjectTotals } from "@/server/hierarchy/recalculate-project-totals";

export async function recalculateHierarchyFromFloor(
  input: {
    buildingId: string;
    projectId: string;
  },
  transaction: AppTransaction | AppDatabase = db
) {
  await recalculateBuildingTotals(input.buildingId, transaction);
  return recalculateProjectTotals(input.projectId, transaction);
}
