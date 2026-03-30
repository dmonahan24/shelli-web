import { randomUUID } from "node:crypto";
import { getRequestHeader } from "@tanstack/react-start/server";
import { db } from "@/db";
import {
  createSessionRecord,
  deleteSessionRecord,
  deleteSessionsForUser,
  findActiveSessionWithUser,
  updateSessionExpiry,
} from "@/db/queries/auth";
import {
  DEFAULT_SESSION_TTL_MS,
  REMEMBER_ME_SESSION_TTL_MS,
  SESSION_ROTATION_WINDOW_MS,
} from "@/lib/auth/constants";
import {
  clearSessionCookie,
  readSessionCookie,
  setSessionCookie,
} from "@/lib/auth/cookies";

export function getRequestIpAddress() {
  const forwarded = getRequestHeader("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return getRequestHeader("x-real-ip") ?? "unknown";
}

export async function createSession(userId: string, rememberMe = false) {
  const sessionId = randomUUID();
  const ttl = rememberMe ? REMEMBER_ME_SESSION_TTL_MS : DEFAULT_SESSION_TTL_MS;
  const expiresAt = new Date(Date.now() + ttl);

  await createSessionRecord(db, {
    id: sessionId,
    userId,
    expiresAt,
    createdAt: new Date(),
  });

  setSessionCookie(sessionId, expiresAt);

  return {
    id: sessionId,
    userId,
    expiresAt,
  };
}

export async function deleteSession(sessionId?: string | null) {
  if (sessionId) {
    await deleteSessionRecord(db, sessionId);
  }

  clearSessionCookie();
}

export async function revokeUserSessions(userId: string) {
  await deleteSessionsForUser(db, userId);
  clearSessionCookie();
}

export async function getCurrentUser() {
  const sessionId = readSessionCookie();
  if (!sessionId) {
    return null;
  }

  const session = await findActiveSessionWithUser(db, sessionId);
  if (!session) {
    clearSessionCookie();
    return null;
  }

  const timeRemaining = session.expiresAt.getTime() - Date.now();
  if (timeRemaining <= SESSION_ROTATION_WINDOW_MS) {
    const newExpiresAt = new Date(Date.now() + DEFAULT_SESSION_TTL_MS);
    await updateSessionExpiry(db, session.id, newExpiresAt);
    setSessionCookie(session.id, newExpiresAt);
    session.expiresAt = newExpiresAt;
  }

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required.");
  }

  return user;
}
