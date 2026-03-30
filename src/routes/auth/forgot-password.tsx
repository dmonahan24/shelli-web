import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getCurrentUserServerFn } from "@/server/auth/get-current-user";

export const Route = createFileRoute("/auth/forgot-password")({
  beforeLoad: async () => {
    const user = await getCurrentUserServerFn();
    if (user) {
      throw redirect({ to: "/dashboard" });
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
