import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "@/lib/env/server";
import * as schema from "@/db/schema";

const client = postgres(env.DATABASE_URL, {
  max: 10,
  prepare: false,
});

export const db = drizzle({ client, schema });
export { client as dbClient };

export type AppDatabase = typeof db;
export type AppTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
