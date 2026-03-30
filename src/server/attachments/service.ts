import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { ZodError, z } from "zod";
import { db } from "@/db";
import { projectAttachments, projects, users } from "@/db/schema";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { requireUser } from "@/lib/auth/session";
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
import { recordProjectActivity, requireOwnedProject } from "@/server/projects/service";

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
  const user = await requireUser();
  await requireOwnedProject(user.id, projectId);

  const input = attachmentListSchema.parse({
    projectId,
    ...(rawInput ?? {}),
  });
  const offset = (input.page - 1) * input.pageSize;
  const whereClause = eq(projectAttachments.projectId, projectId);

  const [rows, totalCountRows] = await Promise.all([
    db
      .select({
        id: projectAttachments.id,
        projectId: projectAttachments.projectId,
        fileName: projectAttachments.fileName,
        originalFileName: projectAttachments.originalFileName,
        mimeType: projectAttachments.mimeType,
        fileSizeBytes: projectAttachments.fileSizeBytes,
        attachmentType: projectAttachments.attachmentType,
        caption: projectAttachments.caption,
        createdAt: projectAttachments.createdAt,
        uploadedBy: users.fullName,
      })
      .from(projectAttachments)
      .innerJoin(users, eq(projectAttachments.uploadedByUserId, users.id))
      .where(whereClause)
      .orderBy(desc(projectAttachments.createdAt), desc(projectAttachments.id))
      .limit(input.pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(projectAttachments)
      .where(whereClause),
  ]);

  const totalCount = totalCountRows[0]?.count ?? 0;

  return {
    rows: rows.map((row) => ({
      ...row,
      fileUrl: `/dashboard/projects/${row.projectId}/attachments/${row.id}/file`,
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
    const user = await requireUser();
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

    await requireOwnedProject(user.id, metadata.projectId);

    for (const file of files) {
      validateIncomingFile(file);
    }

    await db.transaction(async (transaction) => {
      for (const file of files) {
        const storageKey = buildAttachmentStorageKey(metadata.projectId, file.name);
        await writeStoredFile(storageKey, file);

        await transaction.insert(projectAttachments).values({
          id: randomUUID(),
          projectId: metadata.projectId,
          uploadedByUserId: user.id,
          fileName: storageFileName(storageKey),
          originalFileName: file.name,
          mimeType: file.type,
          fileSizeBytes: file.size,
          storageKey,
          attachmentType: metadata.attachmentType,
          caption: normalizeOptionalText(metadata.caption),
          createdAt: new Date(),
        });

        await recordProjectActivity(transaction, {
          actionType: "attachment_uploaded",
          details: {
            originalFileName: file.name,
            attachmentType: metadata.attachmentType,
          },
          projectId: metadata.projectId,
          userId: user.id,
        });
      }
    });

    return success(
      {
        projectId: metadata.projectId,
        uploadedCount: files.length,
      },
      files.length === 1 ? "Attachment uploaded." : "Attachments uploaded."
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.");
    }

    if (error instanceof Error && error.message === "Authentication required.") {
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
    const user = await requireUser();
    const input = deleteProjectAttachmentSchema.parse(rawInput);
    const attachment = await requireOwnedProjectAttachment(user.id, input.projectId, input.attachmentId);

    await db.transaction(async (transaction) => {
      await transaction
        .delete(projectAttachments)
        .where(eq(projectAttachments.id, input.attachmentId));
      await recordProjectActivity(transaction, {
        actionType: "attachment_deleted",
        details: {
          originalFileName: attachment.originalFileName,
          attachmentType: attachment.attachmentType,
        },
        projectId: attachment.projectId,
        userId: user.id,
      });
    });

    await deleteStoredFile(attachment.storageKey);

    return success(
      { attachmentId: input.attachmentId, projectId: attachment.projectId },
      "Attachment deleted."
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Unable to delete the requested attachment.");
    }

    if (error instanceof Error && error.message === "Authentication required.") {
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
  const user = await requireUser();
  await requireOwnedProject(user.id, input.projectId);

  const attachment = await requireOwnedProjectAttachment(
    user.id,
    input.projectId,
    input.attachmentId
  );
  const file = openStoredFile(attachment.storageKey);

  if (!(await file.exists())) {
    return new Response("File not found", { status: 404 });
  }

  const url = new URL(input.request.url);
  const forceDownload = url.searchParams.get("download") === "1";
  const contentDisposition = forceDownload
    ? "attachment"
    : attachment.mimeType.startsWith("image/") || attachment.mimeType === "application/pdf"
      ? "inline"
      : "attachment";

  return new Response(file, {
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
  userId: string,
  projectId: string,
  attachmentId: string
) {
  const attachment = await db
    .select({
      id: projectAttachments.id,
      projectId: projectAttachments.projectId,
      originalFileName: projectAttachments.originalFileName,
      attachmentType: projectAttachments.attachmentType,
      storageKey: projectAttachments.storageKey,
      mimeType: projectAttachments.mimeType,
      fileSizeBytes: projectAttachments.fileSizeBytes,
    })
    .from(projectAttachments)
    .innerJoin(projects, eq(projectAttachments.projectId, projects.id))
    .where(
      and(
        eq(projectAttachments.id, attachmentId),
        eq(projectAttachments.projectId, projectId),
        eq(projects.userId, userId)
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
