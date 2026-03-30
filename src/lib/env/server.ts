import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("./data/concrete-pours.sqlite"),
  UPLOADS_DIR: z.string().min(1).default("./data/uploads"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  APP_URL: z.string().url(),
  EMAIL_FROM: z.string().email(),
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
  DATABASE_URL: process.env.DATABASE_URL,
  UPLOADS_DIR: process.env.UPLOADS_DIR,
  SESSION_SECRET: process.env.SESSION_SECRET ?? "development-session-secret-change-me",
  APP_URL: process.env.APP_URL ?? "http://localhost:3001",
  EMAIL_FROM: process.env.EMAIL_FROM ?? "no-reply@concreteco.local",
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

export const env = parsedEnv.data;
