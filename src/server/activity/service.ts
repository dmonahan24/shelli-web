import { and, desc, eq } from "drizzle-orm";
import { type AppDatabase, type AppTransaction, db } from "@/db";
import { activityEvents, users } from "@/db/schema";

export async function recordActivityEvent(
  transaction: AppTransaction | AppDatabase,
  input: {
    companyId: string;
    projectId?: string | null;
    actorUserId: string;
    eventType: string;
    entityType: string;
    entityId?: string | null;
    summary: string;
    metadata?: Record<string, unknown>;
  }
) {
  await transaction.insert(activityEvents).values({
    companyId: input.companyId,
    projectId: input.projectId ?? null,
    actorUserId: input.actorUserId,
    eventType: input.eventType,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    summary: input.summary,
    metadataJson: input.metadata ?? {},
  });
}

export async function listRecentActivity(input: {
  companyId: string;
  projectId?: string;
  limit?: number;
}) {
  const query = db
    .select({
      id: activityEvents.id,
      projectId: activityEvents.projectId,
      eventType: activityEvents.eventType,
      entityType: activityEvents.entityType,
      entityId: activityEvents.entityId,
      summary: activityEvents.summary,
      metadataJson: activityEvents.metadataJson,
      createdAt: activityEvents.createdAt,
      actorName: users.fullName,
    })
    .from(activityEvents)
    .leftJoin(users, eq(activityEvents.actorUserId, users.id))
    .where(
      input.projectId
        ? and(eq(activityEvents.companyId, input.companyId), eq(activityEvents.projectId, input.projectId))
        : eq(activityEvents.companyId, input.companyId)
    )
    .orderBy(desc(activityEvents.createdAt))
    .limit(input.limit ?? 10);

  return query.then((rows) =>
    rows.map((row) => ({
      ...row,
      actorName: row.actorName ?? "System",
    }))
  );
}
