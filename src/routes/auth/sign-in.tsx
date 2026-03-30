import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getCurrentUserServerFn } from "@/server/auth/get-current-user";

export const Route = createFileRoute("/auth/sign-in")({
  beforeLoad: async () => {
    const user = await getCurrentUserServerFn();
    if (user) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: SignInPage,
});

function SignInPage() {
  return (
    <AuthPageShell
      title="Sign In"
      description="Use your account to access project tracking, schedules, and concrete totals."
    >
      <SignInForm />
    </AuthPageShell>
  );
}
