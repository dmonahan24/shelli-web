import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  getPrincipalHomePath,
  isPendingAccessPrincipal,
} from "@/lib/auth/principal";
import { PendingAccessView } from "@/components/admin/pending-access-view";
import { getCurrentPrincipalServerFn } from "@/server/auth/get-current-user";

export const Route = createFileRoute("/auth/pending-access")({
  beforeLoad: async () => {
    const principal = await getCurrentPrincipalServerFn();

    if (!principal) {
      throw redirect({ to: "/auth/sign-in" });
    }

    if (!isPendingAccessPrincipal(principal)) {
      throw redirect({ to: getPrincipalHomePath(principal) });
    }

    return { principal };
  },
  component: PendingAccessPage,
});

function PendingAccessPage() {
  const { principal } = Route.useRouteContext();

  return <PendingAccessView principal={principal} />;
}
