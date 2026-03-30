import { describe, expect, it } from "bun:test";
import {
  defaultAttachmentTypeForMimeType,
  isAcceptedAttachmentMimeType,
  resolveStoredFilePath,
} from "@/server/attachments/storage";

describe("attachment storage", () => {
  it("resolves safe project storage paths inside the uploads directory", () => {
    const resolvedPath = resolveStoredFilePath("project-1/1711740100-ticket.pdf");

    expect(resolvedPath).toContain("/data/uploads/project-1/");
  });

  it("rejects path traversal outside the uploads directory", () => {
    expect(() => resolveStoredFilePath("../secrets.txt")).toThrow("Invalid storage path.");
  });

  it("classifies supported attachment mime types", () => {
    expect(isAcceptedAttachmentMimeType("image/jpeg")).toBe(true);
    expect(isAcceptedAttachmentMimeType("application/zip")).toBe(false);
    expect(defaultAttachmentTypeForMimeType("image/png")).toBe("photo");
    expect(defaultAttachmentTypeForMimeType("application/pdf")).toBe("inspection_doc");
  });
});
