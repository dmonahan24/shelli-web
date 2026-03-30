import { parse, serialize } from "cookie";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";
import { env } from "@/lib/env/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

export function getCookieHeader() {
  return getRequestHeader("cookie") ?? "";
}

export function readSessionCookie() {
  const cookies = parse(getCookieHeader());
  return cookies[SESSION_COOKIE_NAME] ?? null;
}

export function setSessionCookie(sessionId: string, expiresAt: Date) {
  setResponseHeader(
    "Set-Cookie",
    serialize(SESSION_COOKIE_NAME, sessionId, {
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
