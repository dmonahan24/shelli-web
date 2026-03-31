import type { User as SupabaseUser } from "@supabase/supabase-js";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accessRequests, companies, companyMemberships, platformAdmins, users } from "@/db/schema";
import {
  type AppPrincipal,
  type PendingAccessPrincipal,
  type PlatformAdminPrincipal,
  type TenantUserPrincipal,
  normalizeAppUserRole,
} from "@/lib/auth/principal";
import { memoizeRequestPromise, measureRequestSpan } from "@/lib/server/request-context";

export type InactiveTenantUserPrincipal = {
  kind: "inactive_tenant_user";
  id: string;
  email: string;
  fullName: string;
};

export type AuthUserPrincipalResolution = AppPrincipal | InactiveTenantUserPrincipal;

type AuthIdentity = Pick<SupabaseUser, "id" | "email" | "user_metadata">;

type TenantProfile = {
  id: string;
  companyId: string;
  role: TenantUserPrincipal["role"];
  createdAt: Date;
};

function getAuthUserDisplayName(authUser: AuthIdentity) {
  return (
    (typeof authUser.user_metadata?.full_name === "string"
      ? authUser.user_metadata.full_name
      : null) ??
    authUser.email ??
    "Pending User"
  );
}

async function ensurePrimaryCompanyMembership(profile: TenantProfile) {
  const membershipWhere = and(
    eq(companyMemberships.userId, profile.id),
    eq(companyMemberships.companyId, profile.companyId)
  );

  const existingMembership = await db.query.companyMemberships.findFirst({
    where: membershipWhere,
  });

  if (existingMembership) {
    return existingMembership;
  }

  try {
    await db
      .insert(companyMemberships)
      .values({
        companyId: profile.companyId,
        userId: profile.id,
        role: profile.role,
        status: "active",
        joinedAt: profile.createdAt,
      })
      .onConflictDoNothing();
  } catch (error) {
    console.error("Unable to auto-heal company membership during sign-in.", {
      userId: profile.id,
      companyId: profile.companyId,
      error,
    });
  }

  return db.query.companyMemberships.findFirst({
    where: membershipWhere,
  });
}

export async function resolvePrincipalFromAuthUser(
  authUser: AuthIdentity
): Promise<AuthUserPrincipalResolution> {
  return memoizeRequestPromise(
    `auth:principal-profile:${authUser.id}`,
    async () =>
      measureRequestSpan("auth.resolve_principal_profile", async () => {
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
          const membership = await ensurePrimaryCompanyMembership({
            id: profile.id,
            companyId: profile.companyId,
            role: profile.role,
            createdAt: profile.createdAt,
          });

          const company = await db.query.companies.findFirst({
            where: eq(companies.id, profile.companyId),
          });

          const principal: TenantUserPrincipal = {
            kind: "tenant_user",
            id: profile.id,
            companyId: company?.id ?? profile.companyId,
            companyName: company?.name ?? "Company",
            companySlug: company?.slug ?? "company",
            email: profile.email,
            fullName: profile.fullName,
            role: normalizeAppUserRole(membership?.role ?? profile.role),
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
      })
  );
}
