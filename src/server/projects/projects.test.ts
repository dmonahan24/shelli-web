import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "bun:test";
import { Database as BunDatabase } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { createProjectRecord, listProjectsByUserId } from "@/db/queries/projects";
import * as schema from "@/db/schema";

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

describe("project queries", () => {
  it("lists projects only for the requested user", async () => {
    const database = createTestDatabase();

    await database.insert(schema.users).values([
      {
        id: "user-1",
        email: "user1@example.com",
        passwordHash: "hash-1",
        fullName: "User One",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "user-2",
        email: "user2@example.com",
        passwordHash: "hash-2",
        fullName: "User Two",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await createProjectRecord(database, {
      id: "project-1",
      userId: "user-1",
      name: "Riverside Warehouse Slab",
      address: "1450 River Bend Rd, Albany, NY",
      dateStarted: "2026-03-14",
      estimatedCompletionDate: "2026-05-01",
      totalConcretePoured: 180,
      estimatedTotalConcrete: 640,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await createProjectRecord(database, {
      id: "project-2",
      userId: "user-2",
      name: "West Gate Footings",
      address: "77 Industrial Park Dr, Syracuse, NY",
      dateStarted: "2026-03-20",
      estimatedCompletionDate: "2026-04-18",
      totalConcretePoured: 92.5,
      estimatedTotalConcrete: 310,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const projects = await listProjectsByUserId(database, "user-1");

    expect(projects).toHaveLength(1);
    expect(projects[0]?.name).toBe("Riverside Warehouse Slab");
  });

  it("stores project totals and dates", async () => {
    const database = createTestDatabase();

    await database.insert(schema.users).values({
      id: "user-1",
      email: "user1@example.com",
      passwordHash: "hash-1",
      fullName: "User One",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await createProjectRecord(database, {
      id: "project-1",
      userId: "user-1",
      name: "North Tower Parking Deck",
      address: "12 Granite Ave, Rochester, NY",
      dateStarted: "2026-03-27",
      estimatedCompletionDate: "2026-06-15",
      totalConcretePoured: 48,
      estimatedTotalConcrete: 520,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const projects = await listProjectsByUserId(database, "user-1");

    expect(projects[0]?.estimatedTotalConcrete).toBe(520);
    expect(projects[0]?.dateStarted).toBe("2026-03-27");
  });
});
