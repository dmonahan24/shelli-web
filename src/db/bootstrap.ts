import { eq } from "drizzle-orm";
import { db } from "@/db";
import { companies, users } from "@/db/schema";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const bootstrapConfig = {
  companyName: "Bedrock Build",
  companySlug: "bedrock-build",
  adminEmail: "demo@bedrockbuild.com",
  adminPassword: "password123",
  adminFullName: "Demo Superintendent",
  role: "dispatcher_admin" as const,
};

export async function ensureBootstrapData() {
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

  return {
    companyId: company.id,
    userId: user.id,
  };
}

async function ensureCompany(name: string, slug: string) {
  const existingCompany = await db.query.companies.findFirst({
    where: eq(companies.slug, slug),
  });

  if (existingCompany) {
    return existingCompany;
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
  role: "dispatcher_admin";
}) {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, input.id),
  });

  if (existingUser) {
    return existingUser;
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

if (import.meta.main) {
  const result = await ensureBootstrapData();
  console.log("Bootstrap completed.", result);
}
