import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  isPendingAccessPrincipal,
  isPlatformAdminPrincipal,
} from "@/lib/auth/principal";
import { getCurrentPrincipalServerFn } from "@/server/auth/get-current-user";

export const Route = createFileRoute("/admin")({
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

    if (!isPlatformAdminPrincipal(principal)) {
      throw redirect({ to: "/dashboard" });
    }

    return { user: principal };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = Route.useRouteContext();

  return (
    <AdminShell user={user}>
      <Outlet />
    </AdminShell>
  );
}
