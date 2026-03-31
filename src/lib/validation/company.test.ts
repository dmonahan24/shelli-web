import { describe, expect, it } from "bun:test";
import {
  bulkAssignProjectMembersSchema,
  inviteMemberSchema,
} from "@/lib/validation/company";

describe("company validation", () => {
  it("normalizes invited emails", () => {
    const result = inviteMemberSchema.parse({
      companyId: crypto.randomUUID(),
      email: "Foreman@Example.COM ",
      role: "field_supervisor",
    });

    expect(result.email).toBe("foreman@example.com");
  });

  it("accepts mixed bulk project assignment payloads", () => {
    const result = bulkAssignProjectMembersSchema.safeParse({
      projectId: crypto.randomUUID(),
      assignments: [
        {
          userId: crypto.randomUUID(),
          projectRole: "editor",
        },
        {
          email: "PM@Example.com ",
          companyRole: "project_manager",
          projectRole: "project_admin",
        },
      ],
      projectManagerUserId: "",
      superintendentUserId: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assignments[1]?.email).toBe("pm@example.com");
    }
  });

  it("rejects duplicate users in a bulk project assignment", () => {
    const userId = crypto.randomUUID();
    const result = bulkAssignProjectMembersSchema.safeParse({
      projectId: crypto.randomUUID(),
      assignments: [
        {
          userId,
          projectRole: "editor",
        },
        {
          userId,
          projectRole: "viewer",
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects invited rows without a company role", () => {
    const result = bulkAssignProjectMembersSchema.safeParse({
      projectId: crypto.randomUUID(),
      assignments: [
        {
          email: "crewlead@example.com",
          projectRole: "contributor",
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});
