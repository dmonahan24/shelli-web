import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DashboardShell } from "@/components/app-shell/dashboard-shell";
import {
  isPendingAccessPrincipal,
  isTenantUserPrincipal,
} from "@/lib/auth/principal";
import { getCurrentPrincipalServerFn } from "@/server/auth/get-current-user";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async ({ location }) => {
    const principal = await getCurrentPrincipalServerFn();

    if (!principal) {
      throw redirect({
        to: "/auth/sign-in",
        search: {
          redirect: location.href,
        },
      });
    }

    if (isPendingAccessPrincipal(principal)) {
      throw redirect({ to: "/auth/pending-access" });
    }

    if (!isTenantUserPrincipal(principal)) {
      throw redirect({ to: "/admin" });
    }

    return { user: principal };
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const { user } = Route.useRouteContext();

  return (
    <DashboardShell user={user}>
      <Outlet />
    </DashboardShell>
  );
}
