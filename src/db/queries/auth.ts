import { and, eq, gt, isNull } from "drizzle-orm";
import type { AppDatabase } from "@/db";
import {
  passwordResetTokens,
  sessions,
  users,
  type NewUser,
} from "@/db/schema";

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
  return findUserByEmail(database, input.email);
}

export async function createSessionRecord(
  database: AppDatabase,
  input: {
    id: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
  }
) {
  await database.insert(sessions).values(input);
  return database.query.sessions.findFirst({
    where: eq(sessions.id, input.id),
  });
}

export async function deleteSessionRecord(database: AppDatabase, sessionId: string) {
  await database.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function deleteSessionsForUser(database: AppDatabase, userId: string) {
  await database.delete(sessions).where(eq(sessions.userId, userId));
}

export async function findActiveSessionWithUser(
  database: AppDatabase,
  sessionId: string,
  now = new Date()
) {
  const result = await database.query.sessions.findFirst({
    where: and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)),
    with: {
      user: true,
    },
  });

  return result ?? null;
}

export async function updateSessionExpiry(
  database: AppDatabase,
  sessionId: string,
  expiresAt: Date
) {
  await database
    .update(sessions)
    .set({ expiresAt })
    .where(eq(sessions.id, sessionId));
}

export async function createPasswordResetTokenRecord(
  database: AppDatabase,
  input: typeof passwordResetTokens.$inferInsert
) {
  await database.insert(passwordResetTokens).values(input);
}

export async function findValidPasswordResetToken(
  database: AppDatabase,
  tokenHash: string,
  now = new Date()
) {
  return database.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.tokenHash, tokenHash),
      gt(passwordResetTokens.expiresAt, now),
      isNull(passwordResetTokens.usedAt)
    ),
    with: {
      user: true,
    },
  });
}

export async function markPasswordResetTokenUsed(
  database: AppDatabase,
  tokenId: string,
  usedAt = new Date()
) {
  await database
    .update(passwordResetTokens)
    .set({ usedAt })
    .where(eq(passwordResetTokens.id, tokenId));
}

export async function invalidateUserPasswordResetTokens(
  database: AppDatabase,
  userId: string,
  usedAt = new Date()
) {
  await database
    .update(passwordResetTokens)
    .set({ usedAt })
    .where(and(eq(passwordResetTokens.userId, userId), isNull(passwordResetTokens.usedAt)));
}
