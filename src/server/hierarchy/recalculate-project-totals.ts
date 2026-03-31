import { eq, sql } from "drizzle-orm";
import { db, type AppDatabase, type AppTransaction } from "@/db";
import { projectBuildings, projects } from "@/db/schema";

export async function recalculateProjectTotals(
  projectId: string,
  transaction: AppTransaction | AppDatabase = db
) {
  const [totals] = await transaction
    .select({
      estimatedTotalConcrete: sql<string>`coalesce(sum(${projectBuildings.estimatedConcreteTotal}), 0)`,
      totalConcretePoured: sql<string>`coalesce(sum(${projectBuildings.actualConcreteTotal}), 0)`,
    })
    .from(projectBuildings)
    .where(eq(projectBuildings.projectId, projectId));

  await transaction
    .update(projects)
    .set({
      estimatedTotalConcrete: totals?.estimatedTotalConcrete ?? "0",
      totalConcretePoured: totals?.totalConcretePoured ?? "0",
    })
    .where(eq(projects.id, projectId));

  return transaction.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });
}
