import { readdir } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";
import { env } from "@/lib/env/server";

const migrationsDirectory = join(process.cwd(), "supabase", "migrations");
const migrationFiles = (await readdir(migrationsDirectory))
  .filter((fileName) => fileName.endsWith(".sql"))
  .sort();

if (migrationFiles.length === 0) {
  throw new Error(`No SQL migrations found in ${migrationsDirectory}`);
}

async function runMigrations(connectionString: string) {
  const sql = postgres(connectionString, {
    max: 1,
    prepare: false,
  });

  try {
    for (const migrationFile of migrationFiles) {
      console.log(`Applying migration ${migrationFile}`);
      await sql.file(join(migrationsDirectory, migrationFile));
    }
  } finally {
    await sql.end({ timeout: 0 }).catch(() => undefined);
  }
}

try {
  await runMigrations(env.DIRECT_DATABASE_URL);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const directHostLooksIpv6Only = env.DIRECT_DATABASE_URL.includes("@db.");
  const shouldRetryWithPooler =
    directHostLooksIpv6Only &&
    (message.includes("ECONNREFUSED") || message.includes("getaddrinfo"));

  if (!shouldRetryWithPooler) {
    throw error;
  }

  console.warn(
    "Direct Supabase host was unreachable from this machine. Retrying migrations with DATABASE_URL."
  );
  await runMigrations(env.DATABASE_URL);
}

console.log("Database migrations completed.");
