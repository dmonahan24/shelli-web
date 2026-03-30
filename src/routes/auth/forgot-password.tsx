import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getPrincipalHomePath } from "@/lib/auth/principal";
import { getCurrentPrincipalServerFn } from "@/server/auth/get-current-user";

export const Route = createFileRoute("/auth/forgot-password")({
  beforeLoad: async () => {
    const principal = await getCurrentPrincipalServerFn();
    if (principal) {
      throw redirect({ to: getPrincipalHomePath(principal) });
    }
  },
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <AuthPageShell
      title="Forgot Password"
      description="Enter your email address and we’ll send reset instructions if an account exists."
    >
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
