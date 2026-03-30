import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { db } from "@/db";
import { env } from "@/lib/env/server";

if (env.DATABASE_URL !== ":memory:") {
  mkdirSync(dirname(env.DATABASE_URL), { recursive: true });
}

await migrate(db, {
  migrationsFolder: "./src/db/migrations",
});

console.log("Database migrations completed.");
