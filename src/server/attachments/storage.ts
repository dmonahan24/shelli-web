import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { basename, dirname, extname, resolve, sep } from "node:path";
import {
  acceptedAttachmentMimeTypes,
  attachmentTypeSchema,
} from "@/lib/validation/attachment";
import { env } from "@/lib/env/server";

const mimeExtensionMap: Record<(typeof acceptedAttachmentMimeTypes)[number], string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export function uploadsRootDirectory() {
  return resolve(process.cwd(), env.UPLOADS_DIR);
}

export function resolveStoredFilePath(storageKey: string) {
  const normalizedKey = storageKey.replace(/^\/+/, "");
  const absolutePath = resolve(uploadsRootDirectory(), normalizedKey);
  const uploadsRoot = uploadsRootDirectory();

  if (absolutePath !== uploadsRoot && !absolutePath.startsWith(`${uploadsRoot}${sep}`)) {
    throw new Error("Invalid storage path.");
  }

  return absolutePath;
}

export function buildAttachmentStorageKey(projectId: string, originalFileName: string) {
  const extension = normalizeFileExtension(originalFileName);
  return `${projectId}/${Date.now()}-${randomUUID().slice(0, 8)}${extension}`;
}

export function storageFileName(storageKey: string) {
  return basename(storageKey);
}

export async function writeStoredFile(storageKey: string, file: File) {
  const absolutePath = resolveStoredFilePath(storageKey);
  mkdirSync(dirname(absolutePath), { recursive: true });
  await Bun.write(absolutePath, file);
  return absolutePath;
}

export async function deleteStoredFile(storageKey: string) {
  const absolutePath = resolveStoredFilePath(storageKey);

  try {
    await unlink(absolutePath);
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("code" in error) ||
      (error as NodeJS.ErrnoException).code !== "ENOENT"
    ) {
      throw error;
    }
  }
}

export function openStoredFile(storageKey: string) {
  return Bun.file(resolveStoredFilePath(storageKey));
}

export function isAcceptedAttachmentMimeType(mimeType: string) {
  return acceptedAttachmentMimeTypes.includes(
    mimeType as (typeof acceptedAttachmentMimeTypes)[number]
  );
}

export function defaultAttachmentTypeForMimeType(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return "photo" as const;
  }

  if (mimeType === "application/pdf") {
    return "inspection_doc" as const;
  }

  return attachmentTypeSchema.enum.other;
}

function normalizeFileExtension(originalFileName: string) {
  const extension = extname(originalFileName).toLowerCase();
  if (extension && /^[a-z0-9.]+$/.test(extension)) {
    return extension;
  }

  return ".bin";
}
