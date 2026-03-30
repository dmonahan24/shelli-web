import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { companies, companyMemberships, users } from "@/db/schema";
import type { AppUserRole, TenantUserPrincipal } from "@/lib/auth/principal";
import { hasCompanyPermission } from "@/lib/auth/permissions";
import { requireTenantUser } from "@/lib/auth/session";

export type CompanyAccessContext = {
  user: TenantUserPrincipal;
  company: {
    id: string;
    name: string;
    slug: string;
  };
  membership: {
    id: string;
    role: AppUserRole;
    status: "invited" | "active" | "inactive";
    joinedAt: Date | null;
  };
};

export async function ensureLegacyCompanyMembership(userId: string, companyId: string) {
  const existingMembership = await db.query.companyMemberships.findFirst({
    where: and(eq(companyMemberships.userId, userId), eq(companyMemberships.companyId, companyId)),
  });

  if (existingMembership) {
    return existingMembership;
  }

  const user = await db.query.users.findFirst({
    where: and(eq(users.id, userId), eq(users.companyId, companyId)),
  });

  if (!user) {
    return null;
  }

  const [membership] = await db
    .insert(companyMemberships)
    .values({
      companyId,
      userId,
      role: user.role,
      status: "active",
      invitedByUserId: null,
      joinedAt: user.createdAt,
    })
    .returning();

  return membership ?? null;
}

export async function getCompanyMembershipForUser(userId: string, companyId: string) {
  return (
    (await db
      .select({
        membershipId: companyMemberships.id,
        role: companyMemberships.role,
        status: companyMemberships.status,
        joinedAt: companyMemberships.joinedAt,
        companyId: companies.id,
        companyName: companies.name,
        companySlug: companies.slug,
      })
      .from(companyMemberships)
      .innerJoin(companies, eq(companyMemberships.companyId, companies.id))
      .where(and(eq(companyMemberships.userId, userId), eq(companyMemberships.companyId, companyId)))
      .then((rows) => rows[0] ?? null)) ??
    (await ensureLegacyCompanyMembership(userId, companyId).then(async (membership) => {
      if (!membership) {
        return null;
      }

      const company = await db.query.companies.findFirst({
        where: eq(companies.id, companyId),
      });

      if (!company) {
        return null;
      }

      return {
        membershipId: membership.id,
        role: membership.role,
        status: membership.status,
        joinedAt: membership.joinedAt,
        companyId: company.id,
        companyName: company.name,
        companySlug: company.slug,
      };
    }))
  );
}

export async function requireCompanyMembership(companyId: string): Promise<CompanyAccessContext> {
  const user = await requireTenantUser();
  const membership = await getCompanyMembershipForUser(user.id, companyId);

  if (!membership || membership.status !== "active") {
    throw new Error("Company membership required.");
  }

  return {
    user: {
      ...user,
      companyId: membership.companyId,
      companyName: membership.companyName,
      companySlug: membership.companySlug,
      role: membership.role,
    },
    company: {
      id: membership.companyId,
      name: membership.companyName,
      slug: membership.companySlug,
    },
    membership: {
      id: membership.membershipId,
      role: membership.role,
      status: membership.status,
      joinedAt: membership.joinedAt,
    },
  };
}

export async function requireCompanyRole(companyId: string, roles: AppUserRole[]) {
  const access = await requireCompanyMembership(companyId);

  if (!roles.includes(access.membership.role)) {
    throw new Error("Company role required.");
  }

  return access;
}

export async function canManageMembers(
  user: Pick<TenantUserPrincipal, "id" | "companyId" | "role">,
  companyId: string
) {
  const membership = await getCompanyMembershipForUser(user.id, companyId);
  return Boolean(membership && membership.status === "active" && hasCompanyPermission(membership.role, "manage_members"));
}

export async function canManageInvitations(
  user: Pick<TenantUserPrincipal, "id" | "companyId" | "role">,
  companyId: string
) {
  const membership = await getCompanyMembershipForUser(user.id, companyId);
  return Boolean(
    membership && membership.status === "active" && hasCompanyPermission(membership.role, "manage_invitations")
  );
}

export async function canViewAnalytics(
  user: Pick<TenantUserPrincipal, "id" | "companyId" | "role">,
  companyId: string
) {
  const membership = await getCompanyMembershipForUser(user.id, companyId);
  return Boolean(
    membership && membership.status === "active" && hasCompanyPermission(membership.role, "view_company_analytics")
  );
}
