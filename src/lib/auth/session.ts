import { getRequestHeader } from "@tanstack/react-start/server";
import {
  clearSessionCookie,
  readSessionCookie,
  setSessionCookie,
} from "@/lib/auth/cookies";
import {
  type AppPrincipal,
  isPlatformAdminPrincipal,
  isTenantUserPrincipal,
} from "@/lib/auth/principal";
import { resolvePrincipalFromAuthUser } from "@/lib/auth/resolve-principal";
import { memoizeRequestPromise, measureRequestSpan } from "@/lib/server/request-context";
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

export async function getCurrentPrincipal(): Promise<AppPrincipal | null> {
  return memoizeRequestPromise("auth:current-principal", async () =>
    measureRequestSpan("auth.resolve_principal", async () => {
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

      if (
        data.session.access_token !== cookie.accessToken ||
        data.session.refresh_token !== cookie.refreshToken
      ) {
        setSessionCookie(data.session, cookie.rememberMe);
      }

      const resolvedPrincipal = await resolvePrincipalFromAuthUser(data.session.user);

      if (resolvedPrincipal.kind === "inactive_tenant_user") {
        clearSessionCookie();
        return null;
      }

      return resolvedPrincipal;
    })
  );
}

export async function getCurrentUser() {
  const principal = await getCurrentPrincipal();
  return isTenantUserPrincipal(principal) ? principal : null;
}

export async function requireAuthenticatedPrincipal() {
  const principal = await getCurrentPrincipal();
  if (!principal) {
    throw new Error("Authentication required.");
  }

  return principal;
}

export async function requireTenantUser() {
  const principal = await requireAuthenticatedPrincipal();
  if (!isTenantUserPrincipal(principal)) {
    throw new Error("Tenant access required.");
  }

  return principal;
}

export async function requirePlatformAdmin() {
  const principal = await requireAuthenticatedPrincipal();
  if (!isPlatformAdminPrincipal(principal)) {
    throw new Error("Platform admin access required.");
  }

  return principal;
}
