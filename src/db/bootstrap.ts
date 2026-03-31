import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { companies, companyMemberships, platformAdmins, users } from "@/db/schema";
import { type AppUserRole } from "@/lib/auth/principal";
import { env } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const bootstrapConfig = {
  platformAdminEmail: env.BOOTSTRAP_PLATFORM_ADMIN_EMAIL,
  platformAdminPassword: env.BOOTSTRAP_PLATFORM_ADMIN_PASSWORD,
  platformAdminFullName: env.BOOTSTRAP_PLATFORM_ADMIN_FULL_NAME,
  platformAdminCompanyName: env.BOOTSTRAP_PLATFORM_ADMIN_COMPANY_NAME,
  platformAdminCompanySlug: env.BOOTSTRAP_PLATFORM_ADMIN_COMPANY_SLUG,
  platformAdminCompanyRole: env.BOOTSTRAP_PLATFORM_ADMIN_COMPANY_ROLE,
  companyName: env.BOOTSTRAP_DEMO_COMPANY_NAME,
  companySlug: env.BOOTSTRAP_DEMO_COMPANY_SLUG,
  adminEmail: env.BOOTSTRAP_DEMO_ADMIN_EMAIL,
  adminPassword: env.BOOTSTRAP_DEMO_ADMIN_PASSWORD,
  adminFullName: env.BOOTSTRAP_DEMO_ADMIN_FULL_NAME,
  role: "admin" as const,
};

export async function ensureBootstrapData() {
  const platformAdminAuthUser = await ensureAuthUser({
    email: bootstrapConfig.platformAdminEmail,
    password: bootstrapConfig.platformAdminPassword,
    fullName: bootstrapConfig.platformAdminFullName,
  });
  const platformAdmin = await ensurePlatformAdmin({
    id: platformAdminAuthUser.id,
    email: bootstrapConfig.platformAdminEmail,
    fullName: bootstrapConfig.platformAdminFullName,
  });
  let platformAdminCompanyId: string | null = null;
  let platformAdminTenantUserId: string | null = null;

  if (
    bootstrapConfig.platformAdminCompanyName &&
    bootstrapConfig.platformAdminCompanySlug
  ) {
    const platformAdminCompany = await ensureCompany(
      bootstrapConfig.platformAdminCompanyName,
      bootstrapConfig.platformAdminCompanySlug
    );
    const platformAdminTenantUser = await ensureUserProfile({
      id: platformAdminAuthUser.id,
      companyId: platformAdminCompany.id,
      email: bootstrapConfig.platformAdminEmail,
      fullName: bootstrapConfig.platformAdminFullName,
      role: bootstrapConfig.platformAdminCompanyRole,
    });
    await ensureCompanyMembership({
      companyId: platformAdminCompany.id,
      userId: platformAdminTenantUser.id,
      role: bootstrapConfig.platformAdminCompanyRole,
      joinedAt: platformAdminTenantUser.createdAt,
    });

    platformAdminCompanyId = platformAdminCompany.id;
    platformAdminTenantUserId = platformAdminTenantUser.id;
  }

  const company = await ensureCompany(
    bootstrapConfig.companyName,
    bootstrapConfig.companySlug
  );
  const authUser = await ensureAuthUser({
    email: bootstrapConfig.adminEmail,
    password: bootstrapConfig.adminPassword,
    fullName: bootstrapConfig.adminFullName,
  });
  const user = await ensureUserProfile({
    id: authUser.id,
    companyId: company.id,
    email: bootstrapConfig.adminEmail,
    fullName: bootstrapConfig.adminFullName,
    role: bootstrapConfig.role,
  });
  await ensureCompanyMembership({
    companyId: company.id,
    userId: user.id,
    role: bootstrapConfig.role,
    joinedAt: user.createdAt,
  });

  return {
    platformAdminId: platformAdmin.id,
    platformAdminCompanyId,
    platformAdminTenantUserId,
    companyId: company.id,
    userId: user.id,
  };
}

async function ensureCompany(name: string, slug: string) {
  const existingCompany = await db.query.companies.findFirst({
    where: eq(companies.slug, slug),
  });

  if (existingCompany) {
    if (existingCompany.isActive) {
      return existingCompany;
    }

    const [reactivatedCompany] = await db
      .update(companies)
      .set({
        isActive: true,
      })
      .where(eq(companies.id, existingCompany.id))
      .returning();

    return reactivatedCompany ?? existingCompany;
  }

  const [createdCompany] = await db
    .insert(companies)
    .values({
      name,
      slug,
    })
    .returning();

  if (!createdCompany) {
    throw new Error("Unable to create bootstrap company.");
  }

  return createdCompany;
}

async function ensureAuthUser(input: {
  email: string;
  password: string;
  fullName: string;
}) {
  const supabase = createSupabaseAdminClient();
  const usersResult = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (usersResult.error) {
    throw usersResult.error;
  }

  const existingUser = usersResult.data.users.find(
    (user) => user.email?.toLowerCase() === input.email.toLowerCase()
  );

  if (existingUser) {
    return existingUser;
  }

  const createResult = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.fullName,
    },
  });

  if (createResult.error || !createResult.data.user) {
    throw createResult.error ?? new Error("Unable to create bootstrap auth user.");
  }

  return createResult.data.user;
}

async function ensureUserProfile(input: {
  id: string;
  companyId: string;
  email: string;
  fullName: string;
  role: AppUserRole;
}) {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, input.id),
  });

  if (existingUser) {
    if (existingUser.isActive) {
      return existingUser;
    }

    const [reactivatedUser] = await db
      .update(users)
      .set({
        companyId: input.companyId,
        email: input.email,
        fullName: input.fullName,
        role: input.role,
        isActive: true,
      })
      .where(eq(users.id, input.id))
      .returning();

    return reactivatedUser ?? existingUser;
  }

  const [createdUser] = await db
    .insert(users)
    .values({
      id: input.id,
      companyId: input.companyId,
      email: input.email,
      fullName: input.fullName,
      role: input.role,
      isActive: true,
    })
    .returning();

  if (!createdUser) {
    throw new Error("Unable to create bootstrap user profile.");
  }

  return createdUser;
}

async function ensurePlatformAdmin(input: {
  id: string;
  email: string;
  fullName: string;
}) {
  const existingPlatformAdmin = await db.query.platformAdmins.findFirst({
    where: eq(platformAdmins.id, input.id),
  });

  if (existingPlatformAdmin) {
    if (existingPlatformAdmin.isActive) {
      return existingPlatformAdmin;
    }

    const [reactivatedPlatformAdmin] = await db
      .update(platformAdmins)
      .set({
        email: input.email,
        fullName: input.fullName,
        isActive: true,
      })
      .where(eq(platformAdmins.id, input.id))
      .returning();

    return reactivatedPlatformAdmin ?? existingPlatformAdmin;
  }

  const [createdPlatformAdmin] = await db
    .insert(platformAdmins)
    .values({
      id: input.id,
      email: input.email,
      fullName: input.fullName,
      isActive: true,
    })
    .returning();

  if (!createdPlatformAdmin) {
    throw new Error("Unable to create bootstrap platform admin.");
  }

  return createdPlatformAdmin;
}

async function ensureCompanyMembership(input: {
  companyId: string;
  userId: string;
  role: AppUserRole;
  joinedAt: Date;
}) {
  const existingMembership = await db.query.companyMemberships.findFirst({
    where: and(
      eq(companyMemberships.companyId, input.companyId),
      eq(companyMemberships.userId, input.userId)
    ),
  });

  if (existingMembership) {
    return existingMembership;
  }

  const [createdMembership] = await db
    .insert(companyMemberships)
    .values({
      companyId: input.companyId,
      userId: input.userId,
      role: input.role,
      status: "active",
      joinedAt: input.joinedAt,
    })
    .returning();

  if (!createdMembership) {
    throw new Error("Unable to create bootstrap company membership.");
  }

  return createdMembership;
}

if (import.meta.main) {
  const result = await ensureBootstrapData();
  console.log("Bootstrap completed.", result);
}
