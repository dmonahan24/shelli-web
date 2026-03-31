import { describe, expect, it } from "bun:test";
import {
  hasCompanyPermission,
  hasProjectPermission,
} from "@/lib/auth/permissions";
import type { ProjectAccessContext } from "@/lib/auth/project-access";
import { hasProjectAccess } from "@/lib/auth/project-access";

describe("permission matrix", () => {
  it("grants owners and admins broad company permissions", () => {
    expect(hasCompanyPermission("owner", "manage_members")).toBe(true);
    expect(hasCompanyPermission("admin", "view_company_analytics")).toBe(true);
    expect(hasCompanyPermission("viewer", "manage_members")).toBe(false);
  });

  it("normalizes legacy company roles safely", () => {
    expect(hasCompanyPermission("dispatcher_admin", "manage_members")).toBe(true);
    expect(hasCompanyPermission("field_superintendent", "edit_pours")).toBe(true);
    expect(hasCompanyPermission("qc_technician", "manage_members")).toBe(false);
    expect(hasCompanyPermission(undefined, "manage_members")).toBe(false);
  });

  it("grants project roles scoped access", () => {
    expect(hasProjectPermission("project_admin", "manage")).toBe(true);
    expect(hasProjectPermission("editor", "analytics")).toBe(true);
    expect(hasProjectPermission("viewer", "edit")).toBe(false);
  });

  it("requires assignment for project managers and field supervisors", () => {
    const context: ProjectAccessContext = {
      project: {
        id: "project-1",
        companyId: "company-1",
        name: "North Tower",
        projectManagerUserId: "user-1",
        superintendentUserId: null,
      },
      companyRole: "project_manager",
      projectRole: null,
      hasExplicitAssignments: true,
    };

    expect(hasProjectAccess({ id: "user-1" }, context, "analytics")).toBe(true);
    expect(hasProjectAccess({ id: "user-2" }, context, "analytics")).toBe(false);
  });
});
