import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { CreateAccountForm } from "@/components/auth/create-account-form";
import { getCurrentUserServerFn } from "@/server/auth/get-current-user";

export const Route = createFileRoute("/auth/create-account")({
  beforeLoad: async () => {
    const user = await getCurrentUserServerFn();
    if (user) {
      throw redirect({ to: "/dashboard" });
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
