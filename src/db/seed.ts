import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, pours } from "@/db/schema";
import { ensureBootstrapData } from "@/db/bootstrap";

const bootstrap = await ensureBootstrapData();

const existingProjects = await db.query.projects.findMany({
  where: eq(projects.companyId, bootstrap.companyId),
});

if (existingProjects.length === 0) {
  const [warehouseProject, footingProject, deckProject] = await db
    .insert(projects)
    .values([
      {
        companyId: bootstrap.companyId,
        createdByUserId: bootstrap.userId,
        updatedByUserId: bootstrap.userId,
        name: "Riverside Warehouse Slab",
        address: "1450 River Bend Rd, Albany, NY",
        status: "active",
        projectCode: "ALB-1450-SLAB",
        dateStarted: "2026-03-14",
        estimatedCompletionDate: "2026-05-01",
        totalConcretePoured: "180.00",
        estimatedTotalConcrete: "640.00",
      },
      {
        companyId: bootstrap.companyId,
        createdByUserId: bootstrap.userId,
        updatedByUserId: bootstrap.userId,
        name: "West Gate Footings",
        address: "77 Industrial Park Dr, Syracuse, NY",
        status: "active",
        projectCode: "SYR-077-FTG",
        dateStarted: "2026-03-20",
        estimatedCompletionDate: "2026-04-18",
        totalConcretePoured: "92.50",
        estimatedTotalConcrete: "310.00",
      },
      {
        companyId: bootstrap.companyId,
        createdByUserId: bootstrap.userId,
        updatedByUserId: bootstrap.userId,
        name: "North Tower Parking Deck",
        address: "12 Granite Ave, Rochester, NY",
        status: "active",
        projectCode: "ROC-012-DECK",
        dateStarted: "2026-03-27",
        estimatedCompletionDate: "2026-06-15",
        totalConcretePoured: "48.00",
        estimatedTotalConcrete: "520.00",
      },
    ])
    .returning({ id: projects.id });

  await db.insert(pours).values([
    {
      companyId: bootstrap.companyId,
      projectId: warehouseProject!.id,
      createdByUserId: bootstrap.userId,
      updatedByUserId: bootstrap.userId,
      scheduledDate: "2026-03-29",
      placementAreaLabel: "South wall footing",
      placementAreaType: "footing",
      status: "completed",
      unit: "cubic_yards",
      actualVolume: "20.00",
      deliveredVolume: "20.00",
    },
    {
      companyId: bootstrap.companyId,
      projectId: deckProject!.id,
      createdByUserId: bootstrap.userId,
      updatedByUserId: bootstrap.userId,
      scheduledDate: "2026-04-02",
      placementAreaLabel: "Elevator core",
      placementAreaType: "wall",
      status: "completed",
      unit: "cubic_yards",
      actualVolume: "32.50",
      deliveredVolume: "32.50",
    },
    {
      companyId: bootstrap.companyId,
      projectId: footingProject!.id,
      createdByUserId: bootstrap.userId,
      updatedByUserId: bootstrap.userId,
      scheduledDate: "2026-03-25",
      placementAreaLabel: "Loading dock strip footing",
      placementAreaType: "footing",
      status: "completed",
      unit: "cubic_yards",
      actualVolume: "18.00",
      deliveredVolume: "18.00",
    },
  ]);
}

console.log("Seed completed.");
