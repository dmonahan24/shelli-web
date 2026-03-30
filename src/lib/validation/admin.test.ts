import { describe, expect, it } from "bun:test";
import {
  toggleAdminUserActiveSchema,
  toggleCompanyArchivedSchema,
  updateAdminUserAccessSchema,
} from "@/lib/validation/admin";

describe("admin validation", () => {
  it("requires a note when changing tenant active status", () => {
    const result = toggleAdminUserActiveSchema.safeParse({
      authUserId: crypto.randomUUID(),
      isActive: false,
      notes: "",
    });

    expect(result.success).toBe(false);
  });

  it("requires a note when archiving or restoring a company", () => {
    const result = toggleCompanyArchivedSchema.safeParse({
      companyId: crypto.randomUUID(),
      shouldArchive: true,
      notes: "",
    });

    expect(result.success).toBe(false);
  });

  it("accepts an admin user access update for an existing auth user", () => {
    const result = updateAdminUserAccessSchema.safeParse({
      authUserId: crypto.randomUUID(),
      companyId: crypto.randomUUID(),
      role: "admin",
      fullName: "Jordan Smith",
      notes: "Move this user to the active operating company.",
    });

    expect(result.success).toBe(true);
  });
});
