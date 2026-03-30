import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { CreateAccountForm } from "@/components/auth/create-account-form";
import { getPrincipalHomePath } from "@/lib/auth/principal";
import { getCurrentPrincipalServerFn } from "@/server/auth/get-current-user";

export const Route = createFileRoute("/auth/create-account")({
  validateSearch: z.object({
    token: z.string().optional(),
  }),
  beforeLoad: async () => {
    const principal = await getCurrentPrincipalServerFn();
    if (principal) {
      throw redirect({ to: getPrincipalHomePath(principal) });
    }
  },
  component: CreateAccountPage,
});

function CreateAccountPage() {
  const search = Route.useSearch();

  return (
    <AuthPageShell
      title="Create Account"
      description="Set up your account, create your company workspace, and continue into onboarding."
    >
      <CreateAccountForm inviteToken={search.token} />
    </AuthPageShell>
  );
}
