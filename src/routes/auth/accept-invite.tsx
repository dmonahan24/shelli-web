// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AcceptInvitePage } from "@/components/auth/accept-invite-page";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { getCurrentPrincipalServerFn } from "@/server/auth/get-current-user";
import { getInvitationStatusServerFn } from "@/server/company/accept-invitation";

export const Route = createFileRoute("/auth/accept-invite")({
  validateSearch: z.object({
    token: z.string().catch(""),
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const [principal, status] = await Promise.all([
      getCurrentPrincipalServerFn(),
      getInvitationStatusServerFn({
        data: {
          token: deps.token,
        },
      }),
    ]);

    return {
      principal,
      status,
      token: deps.token,
    };
  },
  component: AcceptInviteRoutePage,
});

function AcceptInviteRoutePage() {
  const data = Route.useLoaderData();

  return (
    <AuthPageShell title="Accept Invitation" description="Join your company workspace and continue into the dashboard.">
      <AcceptInvitePage
        token={data.token}
        status={data.status}
        currentUserEmail={data.principal?.kind === "tenant_user" ? data.principal.email : null}
      />
    </AuthPageShell>
  );
}
