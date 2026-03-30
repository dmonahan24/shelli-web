import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { CreateAccountForm } from "@/components/auth/create-account-form";
import { getPrincipalHomePath } from "@/lib/auth/principal";
import { getCurrentPrincipalServerFn } from "@/server/auth/get-current-user";

export const Route = createFileRoute("/auth/create-account")({
  beforeLoad: async () => {
    const principal = await getCurrentPrincipalServerFn();
    if (principal) {
      throw redirect({ to: getPrincipalHomePath(principal) });
    }
  },
  component: CreateAccountPage,
});

function CreateAccountPage() {
  return (
    <AuthPageShell
      title="Access Request"
      description="Self-service signup is disabled. Ask an administrator to provision your Supabase-backed account."
    >
      <CreateAccountForm />
    </AuthPageShell>
  );
}
