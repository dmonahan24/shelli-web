import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "bun:test";
import { Database as BunDatabase } from "bun:sqlite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "@/db/schema";
import { refreshProjectAggregateTotals } from "@/server/projects/service";

function createTestDatabase() {
  const client = new BunDatabase(":memory:");
  const migrationDirectory = join(process.cwd(), "src/db/migrations");
  const migrationFiles = readdirSync(migrationDirectory)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();

  for (const migrationFile of migrationFiles) {
    client.exec(readFileSync(join(migrationDirectory, migrationFile), "utf8"));
  }

  return drizzle({ client, schema });
}

describe("pour aggregate totals", () => {
  it("recalculates project totals and last pour date from pour events", async () => {
    const database = createTestDatabase();

    await database.insert(schema.users).values({
      id: "user-1",
      email: "user1@example.com",
      passwordHash: "hash-1",
      fullName: "User One",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await database.insert(schema.projects).values({
      id: "project-1",
      userId: "user-1",
      name: "North Tower Parking Deck",
      address: "12 Granite Ave, Rochester, NY",
      status: "active",
      dateStarted: "2026-03-27",
      estimatedCompletionDate: "2026-06-15",
      estimatedTotalConcrete: 520,
      totalConcretePoured: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await database.insert(schema.concretePourEvents).values([
      {
        id: "pour-1",
        projectId: "project-1",
        userId: "user-1",
        pourDate: "2026-03-29",
        concreteAmount: 20,
        unit: "cubic_yards",
        locationDescription: "South wall footing",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "pour-2",
        projectId: "project-1",
        userId: "user-1",
        pourDate: "2026-04-02",
        concreteAmount: 32.5,
        unit: "cubic_yards",
        locationDescription: "Elevator core",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await refreshProjectAggregateTotals(database, "project-1");

    const projectAfterCreate = await database.query.projects.findFirst({
      where: eq(schema.projects.id, "project-1"),
    });

    expect(projectAfterCreate?.totalConcretePoured).toBe(52.5);
    expect(projectAfterCreate?.lastPourDate).toBe("2026-04-02");

    await database
      .update(schema.concretePourEvents)
      .set({
        concreteAmount: 40,
        pourDate: "2026-04-05",
        updatedAt: new Date(),
      })
      .where(eq(schema.concretePourEvents.id, "pour-1"));

    await refreshProjectAggregateTotals(database, "project-1");

    const projectAfterUpdate = await database.query.projects.findFirst({
      where: eq(schema.projects.id, "project-1"),
    });

    expect(projectAfterUpdate?.totalConcretePoured).toBe(72.5);
    expect(projectAfterUpdate?.lastPourDate).toBe("2026-04-05");

    await database
      .delete(schema.concretePourEvents)
      .where(eq(schema.concretePourEvents.id, "pour-1"));

    await refreshProjectAggregateTotals(database, "project-1");

    const projectAfterDelete = await database.query.projects.findFirst({
      where: eq(schema.projects.id, "project-1"),
    });

    expect(projectAfterDelete?.totalConcretePoured).toBe(32.5);
    expect(projectAfterDelete?.lastPourDate).toBe("2026-04-02");
  });
});
