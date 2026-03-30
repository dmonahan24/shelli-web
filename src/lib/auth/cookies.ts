import type { Session } from "@supabase/supabase-js";
import { parse, serialize } from "cookie";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";
import { env } from "@/lib/env/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

type SessionCookiePayload = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  rememberMe: boolean;
};

export function getCookieHeader() {
  return getRequestHeader("cookie") ?? "";
}

export function readSessionCookie() {
  const cookies = parse(getCookieHeader());
  const value = cookies[SESSION_COOKIE_NAME];

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SessionCookiePayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(session: Session, rememberMe = false) {
  const accessToken = session.access_token;
  const refreshToken = session.refresh_token;
  const expiresAt = session.expires_at
    ? new Date(session.expires_at * 1000)
    : new Date(Date.now() + 1000 * 60 * 60);

  const payload = Buffer.from(
    JSON.stringify({
      accessToken,
      refreshToken,
      expiresAt: expiresAt.toISOString(),
      rememberMe,
    } satisfies SessionCookiePayload),
    "utf8"
  ).toString("base64url");

  setResponseHeader(
    "Set-Cookie",
    serialize(SESSION_COOKIE_NAME, payload, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    })
  );
}

export function clearSessionCookie() {
  setResponseHeader(
    "Set-Cookie",
    serialize(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      path: "/",
      expires: new Date(0),
      maxAge: 0,
    })
  );
}
