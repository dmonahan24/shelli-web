import { describe, expect, it } from "bun:test";
import {
  bulkAssignProjectMembersSchema,
  companyOnboardingSchema,
  inviteMemberSchema,
} from "@/lib/validation/company";

describe("company validation", () => {
  it("rejects onboarding project concrete estimates with more than 2 decimal places", () => {
    const result = companyOnboardingSchema.safeParse({
      companyName: "Bedrock Build",
      companySlug: "bedrock-build",
      userRole: "admin",
      projectEstimatedTotalConcrete: 640.123,
    });

    expect(result.success).toBe(false);
  });

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

  it("accepts a leadership-only update with no assignments", () => {
    const result = bulkAssignProjectMembersSchema.safeParse({
      projectId: crypto.randomUUID(),
      assignments: [],
      projectManagerUserId: crypto.randomUUID(),
      superintendentUserId: "",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a bulk project assignment with nothing to save", () => {
    const result = bulkAssignProjectMembersSchema.safeParse({
      projectId: crypto.randomUUID(),
      assignments: [],
      projectManagerUserId: "",
      superintendentUserId: "",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a removal-only payload", () => {
    const result = bulkAssignProjectMembersSchema.safeParse({
      projectId: crypto.randomUUID(),
      assignments: [],
      removals: [crypto.randomUUID()],
    });

    expect(result.success).toBe(true);
  });

  it("treats a null leadership slot as a change worth saving", () => {
    const result = bulkAssignProjectMembersSchema.safeParse({
      projectId: crypto.randomUUID(),
      assignments: [],
      projectManagerUserId: null,
      superintendentUserId: "",
      projectAdminUserId: "",
    });

    expect(result.success).toBe(true);
  });

  it("accepts a project admin assignment", () => {
    const result = bulkAssignProjectMembersSchema.safeParse({
      projectId: crypto.randomUUID(),
      assignments: [],
      projectAdminUserId: crypto.randomUUID(),
    });

    expect(result.success).toBe(true);
  });

  it("rejects assigning and removing the same person in one save", () => {
    const userId = crypto.randomUUID();
    const result = bulkAssignProjectMembersSchema.safeParse({
      projectId: crypto.randomUUID(),
      assignments: [{ userId, projectRole: "editor" }],
      removals: [userId],
    });

    expect(result.success).toBe(false);
  });

  it("rejects one person holding two leadership slots", () => {
    const userId = crypto.randomUUID();
    const result = bulkAssignProjectMembersSchema.safeParse({
      projectId: crypto.randomUUID(),
      assignments: [],
      projectManagerUserId: userId,
      projectAdminUserId: userId,
    });

    expect(result.success).toBe(false);
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
