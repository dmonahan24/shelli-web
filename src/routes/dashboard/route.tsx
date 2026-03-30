import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DashboardShell } from "@/components/app-shell/dashboard-shell";
import { getCurrentUserServerFn } from "@/server/auth/get-current-user";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUserServerFn();

    if (!user) {
      throw redirect({
        to: "/auth/sign-in",
        search: {
          redirect: location.href,
        },
      });
    }

    return { user };
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
