import { getRequestHeader } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  clearSessionCookie,
  readSessionCookie,
  setSessionCookie,
} from "@/lib/auth/cookies";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function getRequestIpAddress() {
  const forwarded = getRequestHeader("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return getRequestHeader("x-real-ip") ?? "unknown";
}

export function persistSession(session: Parameters<typeof setSessionCookie>[0], rememberMe = false) {
  setSessionCookie(session, rememberMe);
}

export async function deleteSession() {
  clearSessionCookie();
}

export async function revokeUserSessions(_userId: string) {
  clearSessionCookie();
}

export async function getCurrentUser() {
  const cookie = readSessionCookie();
  if (!cookie) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.setSession({
    access_token: cookie.accessToken,
    refresh_token: cookie.refreshToken,
  });

  if (error || !data.session) {
    clearSessionCookie();
    return null;
  }

  setSessionCookie(data.session, cookie.rememberMe);

  const profile = await db.query.users.findFirst({
    where: eq(users.id, data.session.user.id),
  });

  if (!profile || !profile.isActive) {
    clearSessionCookie();
    return null;
  }

  return {
    id: profile.id,
    companyId: profile.companyId,
    email: profile.email,
    fullName: profile.fullName,
    role: profile.role,
  };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required.");
  }

  return user;
}
