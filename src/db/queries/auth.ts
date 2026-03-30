import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/db";
import { users, type NewUser } from "@/db/schema";

export async function findUserByEmail(database: AppDatabase, email: string) {
  return database.query.users.findFirst({
    where: eq(users.email, email),
  });
}

export async function findUserById(database: AppDatabase, userId: string) {
  return database.query.users.findFirst({
    where: eq(users.id, userId),
  });
}

export async function createUser(database: AppDatabase, input: NewUser) {
  await database.insert(users).values(input);
  return findUserById(database, input.id);
}

export async function createSessionRecord() {
  throw new Error("Supabase Auth owns session records.");
}

export async function deleteSessionRecord() {
  throw new Error("Supabase Auth owns session records.");
}

export async function deleteSessionsForUser() {
  throw new Error("Supabase Auth owns session records.");
}

export async function findActiveSessionWithUser() {
  throw new Error("Supabase Auth owns session records.");
}

export async function updateSessionExpiry() {
  throw new Error("Supabase Auth owns session records.");
}

export async function createPasswordResetTokenRecord() {
  throw new Error("Supabase Auth owns password reset tokens.");
}

export async function findValidPasswordResetToken() {
  throw new Error("Supabase Auth owns password reset tokens.");
}

export async function markPasswordResetTokenUsed() {
  throw new Error("Supabase Auth owns password reset tokens.");
}

export async function invalidateUserPasswordResetTokens() {
  throw new Error("Supabase Auth owns password reset tokens.");
}
