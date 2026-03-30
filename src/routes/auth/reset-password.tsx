import * as React from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { TokenStatusNotice } from "@/components/auth/token-status-notice";
import { getPrincipalHomePath } from "@/lib/auth/principal";
import { resetPasswordTokenSearchSchema } from "@/lib/validation/auth";
import { getCurrentPrincipalServerFn } from "@/server/auth/get-current-user";
import { getResetPasswordTokenStatusServerFn } from "@/server/auth/reset-password";

export const Route = createFileRoute("/auth/reset-password")({
  validateSearch: resetPasswordTokenSearchSchema,
  beforeLoad: async () => {
    const principal = await getCurrentPrincipalServerFn();
    if (principal) {
      throw redirect({ to: getPrincipalHomePath(principal) });
    }
  },
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const search = Route.useSearch();
  const [tokenStatus, setTokenStatus] = React.useState<{
    valid: boolean;
    status: string;
    message: string;
  } | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = (await getResetPasswordTokenStatusServerFn({
        data: { token: search.token ?? search.token_hash },
      })) as {
        valid: boolean;
        status: string;
        message: string;
      };

      if (!cancelled) {
        setTokenStatus(result);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [search.token, search.token_hash]);

  return (
    <AuthPageShell
      title="Reset Password"
      description="Set a new password for your account. Reset links are single-use and expire automatically."
    >
      <div className="space-y-5">
        {!tokenStatus ? (
          <TokenStatusNotice
            title="Checking reset link"
            message="Validating your reset token."
          />
        ) : tokenStatus.valid ? (
          <>
            <TokenStatusNotice title="Reset link ready" message={tokenStatus.message} />
            <ResetPasswordForm token={search.token ?? search.token_hash ?? ""} />
          </>
        ) : (
          <TokenStatusNotice
            title="Reset link unavailable"
            message={tokenStatus.message}
            variant="destructive"
          />
        )}
      </div>
    </AuthPageShell>
  );
}
