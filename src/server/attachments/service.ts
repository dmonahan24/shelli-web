import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { ZodError, z } from "zod";
import { db } from "@/db";
import { attachments, projects, users } from "@/db/schema";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { requireProjectAccess } from "@/lib/auth/project-access";
import { buildProjectAttachmentFilePath } from "@/lib/project-paths";
import {
  attachmentUploadSchema,
  deleteProjectAttachmentSchema,
  maxAttachmentSizeBytes,
} from "@/lib/validation/attachment";
import { failure, success, type ActionResult } from "@/lib/utils/action-result";
import {
  buildAttachmentStorageKey,
  defaultAttachmentTypeForMimeType,
  deleteStoredFile,
  isAcceptedAttachmentMimeType,
  openStoredFile,
  storageFileName,
  writeStoredFile,
} from "@/server/attachments/storage";
import { recordProjectActivity } from "@/server/projects/service";

const attachmentListSchema = z.object({
  projectId: z.string().uuid("Invalid project id"),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(8).default(8),
});

function normalizeOptionalText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function listProjectAttachments(projectId: string, rawInput?: unknown) {
  await requireProjectAccess(projectId, "view");

  const input = attachmentListSchema.parse({
    projectId,
    ...(rawInput ?? {}),
  });
  const offset = (input.page - 1) * input.pageSize;
  const whereClause = eq(attachments.projectId, projectId);

  const [rows, totalCountRows] = await Promise.all([
    db
      .select({
        id: attachments.id,
        projectId: attachments.projectId,
        projectSlug: projects.slug,
        fileName: attachments.storedFileName,
        originalFileName: attachments.originalFileName,
        mimeType: attachments.mimeType,
        fileSizeBytes: attachments.fileSizeBytes,
        attachmentType: attachments.attachmentType,
        caption: attachments.caption,
        createdAt: attachments.createdAt,
        uploadedBy: users.fullName,
      })
      .from(attachments)
      .innerJoin(projects, eq(attachments.projectId, projects.id))
      .leftJoin(users, eq(attachments.uploadedByUserId, users.id))
      .where(whereClause)
      .orderBy(desc(attachments.createdAt), desc(attachments.id))
      .limit(input.pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(attachments)
      .where(whereClause),
  ]);

  const totalCount = totalCountRows[0]?.count ?? 0;

  return {
    rows: rows.map((row) => ({
      ...row,
      uploadedBy: row.uploadedBy ?? "System",
      fileUrl: buildProjectAttachmentFilePath(
        {
          id: row.projectId,
          slug: row.projectSlug,
        },
        row.id
      ),
      isPreviewable:
        row.mimeType.startsWith("image/") || row.mimeType === "application/pdf",
    })),
    totalCount,
    page: input.page,
    pageSize: input.pageSize,
    pageCount: Math.max(1, Math.ceil(totalCount / input.pageSize)),
  };
}

export async function uploadProjectAttachment(
  formData: FormData
): Promise<ActionResult<{ projectId: string; uploadedCount: number }>> {
  try {
    assertSameOrigin();
    const files = collectAttachmentFiles(formData);
    const projectIdValue = formData.get("projectId");
    const attachmentTypeValue = formData.get("attachmentType");
    const captionValue = formData.get("caption");

    if (files.length === 0) {
      return failure("validation_error", "Choose at least one file to upload.", {
        file: "Choose at least one file to upload.",
      });
    }

    const attachmentType =
      typeof attachmentTypeValue === "string" && attachmentTypeValue.length > 0
        ? attachmentTypeValue
        : defaultAttachmentTypeForMimeType(files[0]!.type);

    const metadata = attachmentUploadSchema.parse({
      projectId: projectIdValue,
      attachmentType,
      caption: captionValue,
    });
    const access = await requireProjectAccess(metadata.projectId, "upload");
    const { user } = access;
    const project = access.context.project;

    for (const file of files) {
      validateIncomingFile(file);
    }

    for (const file of files) {
      const storageKey = buildAttachmentStorageKey(user.companyId, metadata.projectId, file.name);
      await writeStoredFile(storageKey, file);

      await db.insert(attachments).values({
        id: randomUUID(),
        companyId: user.companyId,
        projectId: metadata.projectId,
        uploadedByUserId: user.id,
        storedFileName: storageFileName(storageKey),
        originalFileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
        storageBucket: "project-attachments",
        storagePath: storageKey,
        attachmentType: metadata.attachmentType,
        caption: normalizeOptionalText(metadata.caption),
      });

      await recordProjectActivity(db, {
        actionType: "attachment_uploaded",
        details: {
          originalFileName: file.name,
          attachmentType: metadata.attachmentType,
        },
        projectId: metadata.projectId,
        summary: `Attachment uploaded: ${file.name}`,
        userId: user.id,
      });
    }

    const message =
      files.length === 1
        ? `Attachment uploaded for ${project.name}.`
        : `Attachments uploaded for ${project.name}.`;

    return success(
      {
        projectId: metadata.projectId,
        uploadedCount: files.length,
      },
      message
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.");
    }

    if (
      error instanceof Error &&
      (error.message === "Authentication required." ||
        error.message === "Tenant access required.")
    ) {
      return failure("unauthorized", "You must be signed in to upload attachments.");
    }

    return failure("upload_attachment_failed", "Unable to upload the file right now.");
  }
}

export async function deleteProjectAttachment(
  rawInput: unknown
): Promise<ActionResult<{ attachmentId: string; projectId: string }>> {
  try {
    assertSameOrigin();
    const input = deleteProjectAttachmentSchema.parse(rawInput);
    const access = await requireProjectAccess(input.projectId, "edit");
    const user = access.user;
    const attachment = await requireOwnedProjectAttachment(
      access.context.project.companyId,
      input.projectId,
      input.attachmentId
    );

    await db.delete(attachments).where(eq(attachments.id, input.attachmentId));

    await recordProjectActivity(db, {
      actionType: "attachment_deleted",
      details: {
        originalFileName: attachment.originalFileName,
        attachmentType: attachment.attachmentType,
      },
      projectId: attachment.projectId,
      summary: `Attachment deleted: ${attachment.originalFileName}`,
      userId: user.id,
    });

    await deleteStoredFile(attachment.storagePath);

    return success(
      { attachmentId: input.attachmentId, projectId: attachment.projectId },
      "Attachment deleted."
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Unable to delete the requested attachment.");
    }

    if (
      error instanceof Error &&
      (error.message === "Authentication required." ||
        error.message === "Tenant access required.")
    ) {
      return failure("unauthorized", "You must be signed in to delete an attachment.");
    }

    return failure("delete_attachment_failed", "Unable to delete the attachment right now.");
  }
}

export async function serveProjectAttachmentFile(input: {
  projectId: string;
  attachmentId: string;
  request: Request;
}) {
  const access = await requireProjectAccess(input.projectId, "view");

  const attachment = await requireOwnedProjectAttachment(
    access.context.project.companyId,
    input.projectId,
    input.attachmentId
  );
  const file = await openStoredFile(attachment.storagePath);

  const url = new URL(input.request.url);
  const forceDownload = url.searchParams.get("download") === "1";
  const contentDisposition = forceDownload
    ? "attachment"
    : attachment.mimeType.startsWith("image/") || attachment.mimeType === "application/pdf"
      ? "inline"
      : "attachment";

  return new Response(file.stream(), {
    status: 200,
    headers: {
      "Content-Disposition": `${contentDisposition}; filename="${attachment.originalFileName.replaceAll(
        '"',
        ""
      )}"`,
      "Content-Length": String(attachment.fileSizeBytes),
      "Content-Type": attachment.mimeType,
      "Cache-Control": "private, max-age=60",
    },
  });
}

async function requireOwnedProjectAttachment(
  companyId: string,
  projectId: string,
  attachmentId: string
) {
  const attachment = await db
    .select({
      id: attachments.id,
      projectId: attachments.projectId,
      originalFileName: attachments.originalFileName,
      attachmentType: attachments.attachmentType,
      storagePath: attachments.storagePath,
      mimeType: attachments.mimeType,
      fileSizeBytes: attachments.fileSizeBytes,
    })
    .from(attachments)
    .innerJoin(projects, eq(attachments.projectId, projects.id))
    .where(
      and(
        eq(attachments.id, attachmentId),
        eq(attachments.projectId, projectId),
        eq(projects.companyId, companyId)
      )
    )
    .then((rows) => rows[0] ?? null);

  if (!attachment) {
    throw new Error("Attachment not found.");
  }

  return attachment;
}

function collectAttachmentFiles(formData: FormData) {
  const multiFiles = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (multiFiles.length > 0) {
    return multiFiles;
  }

  const singleFile = formData.get("file");
  if (singleFile instanceof File && singleFile.size > 0) {
    return [singleFile];
  }

  return [];
}

function validateIncomingFile(file: File) {
  if (!isAcceptedAttachmentMimeType(file.type)) {
    throw new ZodError([
      {
        code: "custom",
        message: "Unsupported file type.",
        path: ["file"],
      },
    ]);
  }

  if (file.size <= 0 || file.size > maxAttachmentSizeBytes) {
    throw new ZodError([
      {
        code: "custom",
        message: `File size must be between 1 byte and ${maxAttachmentSizeBytes} bytes.`,
        path: ["file"],
      },
    ]);
  }
}
