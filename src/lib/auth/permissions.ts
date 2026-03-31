import { normalizeAppUserRole, type AppUserRole, type ProjectRole } from "@/lib/auth/principal";

export type CompanyPermission =
  | "manage_members"
  | "manage_projects"
  | "delete_projects"
  | "view_company_analytics"
  | "manage_invitations"
  | "assign_roles"
  | "upload_attachments"
  | "delete_attachments"
  | "edit_pours";

export type ProjectPermission =
  | "view"
  | "edit"
  | "delete"
  | "upload"
  | "analytics"
  | "manage";

const companyPermissionMatrix: Record<AppUserRole, CompanyPermission[]> = {
  owner: [
    "manage_members",
    "manage_projects",
    "delete_projects",
    "view_company_analytics",
    "manage_invitations",
    "assign_roles",
    "upload_attachments",
    "delete_attachments",
    "edit_pours",
  ],
  admin: [
    "manage_members",
    "manage_projects",
    "view_company_analytics",
    "manage_invitations",
    "assign_roles",
    "upload_attachments",
    "delete_attachments",
    "edit_pours",
  ],
  project_manager: [
    "manage_projects",
    "view_company_analytics",
    "upload_attachments",
    "delete_attachments",
    "edit_pours",
  ],
  field_supervisor: ["upload_attachments", "edit_pours"],
  viewer: [],
};

const projectPermissionMatrix: Record<ProjectRole, ProjectPermission[]> = {
  project_admin: ["view", "edit", "delete", "upload", "analytics", "manage"],
  editor: ["view", "edit", "upload", "analytics"],
  contributor: ["view", "edit", "upload"],
  viewer: ["view"],
};

export function hasCompanyPermission(role: string | null | undefined, permission: CompanyPermission) {
  return companyPermissionMatrix[normalizeAppUserRole(role)].includes(permission);
}

export function hasProjectPermission(role: ProjectRole, permission: ProjectPermission) {
  return projectPermissionMatrix[role].includes(permission);
}

export function normalizeProjectPermissionForCompanyRole(
  role: string | null | undefined,
  permission: ProjectPermission
) {
  const normalizedRole = normalizeAppUserRole(role);

  if (normalizedRole === "owner" || normalizedRole === "admin") {
    return true;
  }

  if (permission === "analytics") {
    return hasCompanyPermission(normalizedRole, "view_company_analytics");
  }

  if (permission === "upload") {
    return hasCompanyPermission(normalizedRole, "upload_attachments");
  }

  if (permission === "delete") {
    return hasCompanyPermission(normalizedRole, "delete_projects");
  }

  if (permission === "manage") {
    return hasCompanyPermission(normalizedRole, "manage_projects");
  }

  if (permission === "edit") {
    return (
      hasCompanyPermission(normalizedRole, "manage_projects") ||
      hasCompanyPermission(normalizedRole, "edit_pours")
    );
  }

  return true;
}
