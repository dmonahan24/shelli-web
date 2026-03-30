import { desc, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db";
import { projectActivity, projects, type NewProject } from "@/db/schema";

export async function listProjectsByUserId(database: AppDatabase, userId: string) {
  return database.query.projects.findMany({
    where: eq(projects.userId, userId),
    orderBy: desc(projects.dateStarted),
  });
}

export async function createProjectRecord(database: AppDatabase, input: NewProject) {
  await database.insert(projects).values(input);
  return database.query.projects.findFirst({
    where: eq(projects.id, input.id!),
  });
}

export async function createProjectActivityRecord(
  database: AppDatabase,
  input: typeof projectActivity.$inferInsert
) {
  await database.insert(projectActivity).values(input);
}
