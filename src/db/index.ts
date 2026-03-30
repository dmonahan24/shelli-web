import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Database as BunDatabase } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { env } from "@/lib/env/server";
import * as schema from "@/db/schema";

function ensureDatabaseDirectory(databaseUrl: string) {
  if (databaseUrl === ":memory:") {
    return;
  }

  const directory = dirname(databaseUrl);
  if (directory && directory !== ".") {
    mkdirSync(directory, { recursive: true });
  }
}

ensureDatabaseDirectory(env.DATABASE_URL);

const client = new BunDatabase(env.DATABASE_URL, { create: true });

export const db = drizzle({ client, schema });

export type AppDatabase = typeof db;
export type AppTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
