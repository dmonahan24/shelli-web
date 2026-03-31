import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { Database as BunDatabase } from "bun:sqlite";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { attachments, auditEvents, loadTickets, projects, pours } from "@/db/schema";
import { env } from "@/lib/env/server";
import { ensureBootstrapData } from "@/db/bootstrap";
import { buildAttachmentStorageKey, writeStoredFile } from "@/server/attachments/storage";
import { generateProjectSlug } from "@/server/navigation/service";

type LegacyUser = {
  id: string;
  email: string;
  full_name: string;
};

type LegacyProject = {
  id: string;
  user_id: string;
  name: string;
  address: string;
  status: string;
  description: string | null;
  last_pour_date: string | null;
  project_code: string | null;
  date_started: string;
  estimated_completion_date: string;
  total_concrete_poured: number;
  estimated_total_concrete: number;
};

type LegacyPour = {
  id: string;
  project_id: string;
  user_id: string;
  pour_date: string;
  concrete_amount: number;
  unit: string;
  location_description: string;
  mix_type: string | null;
  supplier_name: string | null;
  ticket_number: string | null;
  weather_notes: string | null;
  crew_notes: string | null;
};

type LegacyAttachment = {
  id: string;
  project_id: string;
  uploaded_by_user_id: string;
  file_name: string;
  original_file_name: string;
  mime_type: string;
  file_size_bytes: number;
  storage_key: string;
  attachment_type: "photo" | "delivery_ticket" | "inspection_doc" | "other";
  caption: string | null;
};

type LegacyActivity = {
  id: string;
  project_id: string;
  user_id: string;
  action_type: string;
  details_json: string;
  created_at: number;
};

const sqlitePath = resolve(process.cwd(), env.LEGACY_SQLITE_URL);

if (!existsSync(sqlitePath)) {
  throw new Error(`Legacy SQLite database not found at ${sqlitePath}`);
}

const legacyDb = new BunDatabase(sqlitePath, { readonly: true });
const bootstrap = await ensureBootstrapData();

const legacyUsers = legacyDb.query("select id, email, full_name from users").all() as LegacyUser[];
const legacyProjects = legacyDb
  .query(
    "select id, user_id, name, address, status, description, last_pour_date, project_code, date_started, estimated_completion_date, total_concrete_poured, estimated_total_concrete from projects"
  )
  .all() as LegacyProject[];
const legacyPours = legacyDb
  .query(
    "select id, project_id, user_id, pour_date, concrete_amount, unit, location_description, mix_type, supplier_name, ticket_number, weather_notes, crew_notes from concrete_pour_events"
  )
  .all() as LegacyPour[];
const legacyAttachments = legacyDb
  .query(
    "select id, project_id, uploaded_by_user_id, file_name, original_file_name, mime_type, file_size_bytes, storage_key, attachment_type, caption from project_attachments"
  )
  .all() as LegacyAttachment[];
const legacyActivity = legacyDb
  .query(
    "select id, project_id, user_id, action_type, details_json, created_at from project_activity"
  )
  .all() as LegacyActivity[];

const legacyProjectIdToNewProjectId = new Map<string, string>();
const legacyPourIdToNewPourId = new Map<string, string>();

for (const legacyProject of legacyProjects) {
  const [existingProject] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      eq(projects.projectCode, legacyProject.project_code ?? `legacy-${legacyProject.id.slice(0, 8)}`)
    )
    .limit(1);

  if (existingProject) {
    legacyProjectIdToNewProjectId.set(legacyProject.id, existingProject.id);
    continue;
  }

  const [createdProject] = await db
    .insert(projects)
    .values({
      companyId: bootstrap.companyId,
      createdByUserId: bootstrap.userId,
      updatedByUserId: bootstrap.userId,
      name: legacyProject.name,
      slug: await generateProjectSlug(bootstrap.companyId, legacyProject.name),
      address: legacyProject.address,
      status:
        legacyProject.status === "completed" || legacyProject.status === "on_hold"
          ? legacyProject.status
          : "active",
      description: legacyProject.description,
      projectCode: legacyProject.project_code ?? `legacy-${legacyProject.id.slice(0, 8)}`,
      dateStarted: legacyProject.date_started,
      estimatedCompletionDate: legacyProject.estimated_completion_date,
      lastPourDate: legacyProject.last_pour_date,
      totalConcretePoured: String(legacyProject.total_concrete_poured),
      estimatedTotalConcrete: String(legacyProject.estimated_total_concrete),
    })
    .returning({ id: projects.id });

  legacyProjectIdToNewProjectId.set(legacyProject.id, createdProject!.id);
}

for (const legacyPour of legacyPours) {
  const newProjectId = legacyProjectIdToNewProjectId.get(legacyPour.project_id);
  if (!newProjectId) {
    continue;
  }

  const [createdPour] = await db
    .insert(pours)
    .values({
      companyId: bootstrap.companyId,
      projectId: newProjectId,
      createdByUserId: bootstrap.userId,
      updatedByUserId: bootstrap.userId,
      scheduledDate: legacyPour.pour_date,
      placementAreaLabel: legacyPour.location_description,
      placementAreaType: "other",
      status: "completed",
      unit: legacyPour.unit,
      actualVolume: String(legacyPour.concrete_amount),
      deliveredVolume: String(legacyPour.concrete_amount),
      weatherNotes: legacyPour.weather_notes,
      notes: legacyPour.crew_notes,
    })
    .returning({ id: pours.id });

  legacyPourIdToNewPourId.set(legacyPour.id, createdPour!.id);

  if (legacyPour.ticket_number || legacyPour.supplier_name) {
    await db.insert(loadTickets).values({
      companyId: bootstrap.companyId,
      projectId: newProjectId,
      pourId: createdPour!.id,
      createdByUserId: bootstrap.userId,
      updatedByUserId: bootstrap.userId,
      ticketNumber: legacyPour.ticket_number,
      supplierName: legacyPour.supplier_name,
      quantity: String(legacyPour.concrete_amount),
      status: "accepted",
    });
  }
}

for (const legacyAttachment of legacyAttachments) {
  const newProjectId = legacyProjectIdToNewProjectId.get(legacyAttachment.project_id);
  if (!newProjectId) {
    continue;
  }

  const storageSourcePath = resolve(process.cwd(), "data", "uploads", legacyAttachment.storage_key);
  const legacyFile = Bun.file(storageSourcePath);

  if (!(await legacyFile.exists())) {
    continue;
  }

  const targetStoragePath = buildAttachmentStorageKey(
    bootstrap.companyId,
    newProjectId,
    legacyAttachment.original_file_name
  );

  const uploadedFile = new File([await legacyFile.arrayBuffer()], legacyAttachment.original_file_name, {
    type: legacyAttachment.mime_type,
  });

  await writeStoredFile(targetStoragePath, uploadedFile);

  await db.insert(attachments).values({
    id: legacyAttachment.id,
    companyId: bootstrap.companyId,
    projectId: newProjectId,
    uploadedByUserId: bootstrap.userId,
    originalFileName: legacyAttachment.original_file_name,
    storedFileName: legacyAttachment.file_name,
    mimeType: legacyAttachment.mime_type,
    fileSizeBytes: legacyAttachment.file_size_bytes,
    storageBucket: "project-attachments",
    storagePath: targetStoragePath,
    attachmentType: legacyAttachment.attachment_type,
    caption: legacyAttachment.caption,
  });
}

for (const activity of legacyActivity) {
  const newProjectId = legacyProjectIdToNewProjectId.get(activity.project_id);
  if (!newProjectId) {
    continue;
  }

  await db.insert(auditEvents).values({
    id: activity.id,
    companyId: bootstrap.companyId,
    projectId: newProjectId,
    actorUserId: bootstrap.userId,
    entityType: "project",
    entityId: newProjectId,
    actionType: activity.action_type,
    summary: activity.action_type.replaceAll("_", " "),
    detailsJson: safeParseJson(activity.details_json),
    createdAt: new Date(activity.created_at),
  });
}

legacyDb.close();

console.log("Legacy SQLite migration completed.", {
  attachments: legacyAttachments.length,
  pours: legacyPours.length,
  projects: legacyProjects.length,
  users: legacyUsers.length,
});

function safeParseJson(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return { raw: value };
  }
}
