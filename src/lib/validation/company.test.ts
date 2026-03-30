import { describe, expect, it } from "bun:test";
import { inviteMemberSchema } from "@/lib/validation/company";

describe("company validation", () => {
  it("normalizes invited emails", () => {
    const result = inviteMemberSchema.parse({
      companyId: crypto.randomUUID(),
      email: "Foreman@Example.COM ",
      role: "field_supervisor",
    });

    expect(result.email).toBe("foreman@example.com");
  });
});
