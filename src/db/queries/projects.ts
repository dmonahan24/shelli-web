import { desc, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db";
import { auditEvents, projects, type NewProject } from "@/db/schema";

export async function listProjectsByUserId(database: AppDatabase, userId: string) {
  const user = await database.query.users.findFirst({
    where: (users, operators) => eq(users.id, userId),
  });

  if (!user) {
    return [];
  }

  return database.query.projects.findMany({
    where: eq(projects.companyId, user.companyId),
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
  input: typeof auditEvents.$inferInsert
) {
  await database.insert(auditEvents).values(input);
}
