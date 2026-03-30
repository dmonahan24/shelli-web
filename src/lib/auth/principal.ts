export const appUserRoleValues = [
  "owner",
  "admin",
  "project_manager",
  "field_supervisor",
  "viewer",
] as const;

export type AppUserRole = (typeof appUserRoleValues)[number];
export type CompanyRole = AppUserRole;

export const projectRoleValues = [
  "project_admin",
  "editor",
  "contributor",
  "viewer",
] as const;

export type ProjectRole = (typeof projectRoleValues)[number];

export const accessRequestStatusValues = ["pending", "approved", "rejected"] as const;

export type AccessRequestStatus = (typeof accessRequestStatusValues)[number];

export const adminUserStatusValues = [
  "unassigned_auth_user",
  "pending_access",
  "tenant_active",
  "tenant_inactive",
  "platform_admin",
] as const;

export type AdminUserStatus = (typeof adminUserStatusValues)[number];

export type TenantUserPrincipal = {
  kind: "tenant_user";
  id: string;
  companyId: string;
  companyName: string;
  companySlug: string;
  email: string;
  fullName: string;
  role: AppUserRole;
};

export type PlatformAdminPrincipal = {
  kind: "platform_admin";
  id: string;
  email: string;
  fullName: string;
};

export type PendingAccessPrincipal = {
  kind: "pending_access";
  id: string;
  email: string;
  fullName: string;
  accessRequest: {
    id: string;
    status: AccessRequestStatus;
    requestedAt: string;
    resolvedAt: string | null;
    notes: string | null;
    targetCompanyId: string | null;
    targetRole: AppUserRole | null;
  } | null;
};

export type AppPrincipal =
  | TenantUserPrincipal
  | PlatformAdminPrincipal
  | PendingAccessPrincipal;

export function isTenantUserPrincipal(principal: AppPrincipal | null): principal is TenantUserPrincipal {
  return principal?.kind === "tenant_user";
}

export function isPlatformAdminPrincipal(
  principal: AppPrincipal | null
): principal is PlatformAdminPrincipal {
  return principal?.kind === "platform_admin";
}

export function isPendingAccessPrincipal(
  principal: AppPrincipal | null
): principal is PendingAccessPrincipal {
  return principal?.kind === "pending_access";
}

export function getPrincipalHomePath(principal: AppPrincipal) {
  switch (principal.kind) {
    case "tenant_user":
      return "/dashboard" as const;
    case "platform_admin":
      return "/admin" as const;
    case "pending_access":
      return "/auth/pending-access" as const;
  }
}
