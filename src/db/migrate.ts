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

const sql = postgres(env.DIRECT_DATABASE_URL, {
  max: 1,
  prepare: false,
});

for (const migrationFile of migrationFiles) {
  console.log(`Applying migration ${migrationFile}`);
  await sql.file(join(migrationsDirectory, migrationFile));
}

await sql.end();

console.log("Database migrations completed.");
