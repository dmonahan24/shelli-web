import { randomUUID } from "node:crypto";
import { basename, extname } from "node:path";
import { env } from "@/lib/env/server";
import {
  acceptedAttachmentMimeTypes,
  attachmentTypeSchema,
} from "@/lib/validation/attachment";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const mimeExtensionMap: Record<(typeof acceptedAttachmentMimeTypes)[number], string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export function buildAttachmentStorageKey(
  companyId: string,
  projectId: string,
  originalFileName: string,
  entity = "project"
) {
  const extension = normalizeFileExtension(originalFileName);
  return `${companyId}/${projectId}/${entity}/${Date.now()}-${randomUUID().slice(0, 8)}${extension}`;
}

export function storageFileName(storageKey: string) {
  return basename(storageKey);
}

export async function writeStoredFile(storageKey: string, file: File) {
  const supabase = createSupabaseAdminClient();
  const uploadResult = await supabase.storage
    .from(env.SUPABASE_ATTACHMENTS_BUCKET)
    .upload(storageKey, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadResult.error) {
    throw uploadResult.error;
  }

  return uploadResult.data.path;
}

export async function deleteStoredFile(storageKey: string) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.storage.from(env.SUPABASE_ATTACHMENTS_BUCKET).remove([storageKey]);

  if (result.error) {
    throw result.error;
  }
}

export async function openStoredFile(storageKey: string) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.storage
    .from(env.SUPABASE_ATTACHMENTS_BUCKET)
    .download(storageKey);

  if (result.error) {
    throw result.error;
  }

  return result.data;
}

export async function createSignedAttachmentUrl(storageKey: string, expiresInSeconds = 60) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.storage
    .from(env.SUPABASE_ATTACHMENTS_BUCKET)
    .createSignedUrl(storageKey, expiresInSeconds);

  if (result.error) {
    throw result.error;
  }

  return result.data.signedUrl;
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
