import type { User as SupabaseUser } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accessRequests, platformAdmins, users } from "@/db/schema";
import {
  type AppPrincipal,
  type PendingAccessPrincipal,
  type PlatformAdminPrincipal,
  type TenantUserPrincipal,
} from "@/lib/auth/principal";

export type InactiveTenantUserPrincipal = {
  kind: "inactive_tenant_user";
  id: string;
  email: string;
  fullName: string;
};

export type AuthUserPrincipalResolution = AppPrincipal | InactiveTenantUserPrincipal;

type AuthIdentity = Pick<SupabaseUser, "id" | "email" | "user_metadata">;

function getAuthUserDisplayName(authUser: AuthIdentity) {
  return (
    (typeof authUser.user_metadata?.full_name === "string"
      ? authUser.user_metadata.full_name
      : null) ??
    authUser.email ??
    "Pending User"
  );
}

export async function resolvePrincipalFromAuthUser(
  authUser: AuthIdentity
): Promise<AuthUserPrincipalResolution> {
  const [platformAdminProfile, profile, accessRequest] = await Promise.all([
    db.query.platformAdmins.findFirst({
      where: eq(platformAdmins.id, authUser.id),
    }),
    db.query.users.findFirst({
      where: eq(users.id, authUser.id),
    }),
    db.query.accessRequests.findFirst({
      where: eq(accessRequests.authUserId, authUser.id),
    }),
  ]);

  if (platformAdminProfile?.isActive) {
    const principal: PlatformAdminPrincipal = {
      kind: "platform_admin",
      id: platformAdminProfile.id,
      email: platformAdminProfile.email,
      fullName: platformAdminProfile.fullName,
    };

    return principal;
  }

  if (profile?.isActive) {
    const principal: TenantUserPrincipal = {
      kind: "tenant_user",
      id: profile.id,
      companyId: profile.companyId,
      email: profile.email,
      fullName: profile.fullName,
      role: profile.role,
    };

    return principal;
  }

  if (profile && !profile.isActive) {
    return {
      kind: "inactive_tenant_user",
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
    };
  }

  const pendingPrincipal: PendingAccessPrincipal = {
    kind: "pending_access",
    id: authUser.id,
    email: authUser.email ?? accessRequest?.email ?? "",
    fullName: accessRequest?.fullName ?? getAuthUserDisplayName(authUser),
    accessRequest: accessRequest
      ? {
          id: accessRequest.id,
          status: accessRequest.status,
          requestedAt: accessRequest.requestedAt.toISOString(),
          resolvedAt: accessRequest.resolvedAt?.toISOString() ?? null,
          notes: accessRequest.notes ?? null,
          targetCompanyId: accessRequest.targetCompanyId ?? null,
          targetRole: accessRequest.targetRole ?? null,
        }
      : null,
  };

  return pendingPrincipal;
}
