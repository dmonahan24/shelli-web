import { z } from "zod";
import { appUserRoleValues } from "@/lib/auth/principal";

const envSchema = z.object({
  SUPABASE_PROJECT_REF: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  DIRECT_DATABASE_URL: z.string().min(1),
  SUPABASE_ATTACHMENTS_BUCKET: z.string().min(1).default("project-attachments"),
  LEGACY_SQLITE_URL: z.string().min(1).default("./data/concrete-pours.sqlite"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  APP_URL: z.string().url(),
  EMAIL_FROM: z.string().email(),
  BOOTSTRAP_PLATFORM_ADMIN_EMAIL: z.string().email().default("owner@shelli.local"),
  BOOTSTRAP_PLATFORM_ADMIN_PASSWORD: z
    .string()
    .min(8, "BOOTSTRAP_PLATFORM_ADMIN_PASSWORD must be at least 8 characters")
    .default("ChangeMe123!"),
  BOOTSTRAP_PLATFORM_ADMIN_FULL_NAME: z
    .string()
    .min(1)
    .default("Shelli Platform Admin"),
  BOOTSTRAP_PLATFORM_ADMIN_COMPANY_NAME: z.string().trim().min(1).optional(),
  BOOTSTRAP_PLATFORM_ADMIN_COMPANY_SLUG: z.string().trim().min(1).optional(),
  BOOTSTRAP_PLATFORM_ADMIN_COMPANY_ROLE: z
    .enum(appUserRoleValues)
    .default("dispatcher_admin"),
  BOOTSTRAP_DEMO_COMPANY_NAME: z.string().min(1).default("Bedrock Build"),
  BOOTSTRAP_DEMO_COMPANY_SLUG: z.string().min(1).default("bedrock-build"),
  BOOTSTRAP_DEMO_ADMIN_EMAIL: z.string().email().default("demo@bedrockbuild.com"),
  BOOTSTRAP_DEMO_ADMIN_PASSWORD: z
    .string()
    .min(8, "BOOTSTRAP_DEMO_ADMIN_PASSWORD must be at least 8 characters")
    .default("password123"),
  BOOTSTRAP_DEMO_ADMIN_FULL_NAME: z.string().min(1).default("Demo Superintendent"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

const parsedEnv = envSchema.safeParse({
  SUPABASE_PROJECT_REF: process.env.SUPABASE_PROJECT_REF,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_DATABASE_URL: process.env.DIRECT_DATABASE_URL,
  SUPABASE_ATTACHMENTS_BUCKET: process.env.SUPABASE_ATTACHMENTS_BUCKET,
  LEGACY_SQLITE_URL: process.env.LEGACY_SQLITE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET ?? "development-session-secret-change-me",
  APP_URL: process.env.APP_URL ?? "http://localhost:3001",
  EMAIL_FROM: process.env.EMAIL_FROM ?? "no-reply@concreteco.local",
  BOOTSTRAP_PLATFORM_ADMIN_EMAIL: process.env.BOOTSTRAP_PLATFORM_ADMIN_EMAIL,
  BOOTSTRAP_PLATFORM_ADMIN_PASSWORD: process.env.BOOTSTRAP_PLATFORM_ADMIN_PASSWORD,
  BOOTSTRAP_PLATFORM_ADMIN_FULL_NAME: process.env.BOOTSTRAP_PLATFORM_ADMIN_FULL_NAME,
  BOOTSTRAP_PLATFORM_ADMIN_COMPANY_NAME: process.env.BOOTSTRAP_PLATFORM_ADMIN_COMPANY_NAME,
  BOOTSTRAP_PLATFORM_ADMIN_COMPANY_SLUG: process.env.BOOTSTRAP_PLATFORM_ADMIN_COMPANY_SLUG,
  BOOTSTRAP_PLATFORM_ADMIN_COMPANY_ROLE: process.env.BOOTSTRAP_PLATFORM_ADMIN_COMPANY_ROLE,
  BOOTSTRAP_DEMO_COMPANY_NAME: process.env.BOOTSTRAP_DEMO_COMPANY_NAME,
  BOOTSTRAP_DEMO_COMPANY_SLUG: process.env.BOOTSTRAP_DEMO_COMPANY_SLUG,
  BOOTSTRAP_DEMO_ADMIN_EMAIL: process.env.BOOTSTRAP_DEMO_ADMIN_EMAIL,
  BOOTSTRAP_DEMO_ADMIN_PASSWORD: process.env.BOOTSTRAP_DEMO_ADMIN_PASSWORD,
  BOOTSTRAP_DEMO_ADMIN_FULL_NAME: process.env.BOOTSTRAP_DEMO_ADMIN_FULL_NAME,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMTP_SECURE: process.env.SMTP_SECURE,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsedEnv.success) {
  throw new Error(
    `Invalid environment configuration: ${parsedEnv.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ")}`
  );
}

const platformAdminCompanyPathIsPartial =
  Boolean(parsedEnv.data.BOOTSTRAP_PLATFORM_ADMIN_COMPANY_NAME) !==
  Boolean(parsedEnv.data.BOOTSTRAP_PLATFORM_ADMIN_COMPANY_SLUG);

if (platformAdminCompanyPathIsPartial) {
  throw new Error(
    "Invalid environment configuration: BOOTSTRAP_PLATFORM_ADMIN_COMPANY_NAME and BOOTSTRAP_PLATFORM_ADMIN_COMPANY_SLUG must both be set when provisioning the platform admin as a tenant user."
  );
}

export const env = parsedEnv.data;
