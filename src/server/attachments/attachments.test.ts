import { describe, expect, it } from "bun:test";
import {
  buildAttachmentStorageKey,
  defaultAttachmentTypeForMimeType,
  isAcceptedAttachmentMimeType,
  storageFileName,
} from "@/server/attachments/storage";

describe("attachment storage", () => {
  it("builds Supabase storage paths scoped by company and project", () => {
    const storageKey = buildAttachmentStorageKey(
      "company-1",
      "project-1",
      "ticket.pdf"
    );

    expect(storageKey).toContain("company-1/project-1/project/");
    expect(storageKey.endsWith(".pdf")).toBe(true);
    expect(storageFileName(storageKey)).toContain(".pdf");
  });

  it("classifies supported attachment mime types", () => {
    expect(isAcceptedAttachmentMimeType("image/jpeg")).toBe(true);
    expect(isAcceptedAttachmentMimeType("application/zip")).toBe(false);
    expect(defaultAttachmentTypeForMimeType("image/png")).toBe("photo");
    expect(defaultAttachmentTypeForMimeType("application/pdf")).toBe("inspection_doc");
  });
});
