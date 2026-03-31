import * as React from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { TokenStatusNotice } from "@/components/auth/token-status-notice";
import { getPrincipalHomePath } from "@/lib/auth/principal";
import { resetPasswordTokenSearchSchema } from "@/lib/validation/auth";
import { getCurrentPrincipalServerFn } from "@/server/auth/get-current-user";
import { getResetPasswordTokenStatusServerFn } from "@/server/auth/reset-password";

type RecoverySession = {
  accessToken: string;
  refreshToken: string;
};

function parseRecoverySessionFromHash(hash: string): {
  recoverySession: RecoverySession | null;
  errorMessage: string | null;
} {
  const normalizedHash = hash.startsWith("#") ? hash.slice(1) : hash;

  if (!normalizedHash) {
    return {
      recoverySession: null,
      errorMessage: null,
    };
  }

  const params = new URLSearchParams(normalizedHash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const type = params.get("type");
  const errorDescription = params.get("error_description");
  const errorCode = params.get("error_code");

  if (errorDescription || errorCode) {
    return {
      recoverySession: null,
      errorMessage:
        errorDescription ??
        "This reset link could not be verified. Please request a new password reset email.",
    };
  }

  if (!accessToken && !refreshToken) {
    return {
      recoverySession: null,
      errorMessage: null,
    };
  }

  if (!accessToken || !refreshToken || (type && type !== "recovery")) {
    return {
      recoverySession: null,
      errorMessage: "This reset link is incomplete or invalid. Please request a new one.",
    };
  }

  return {
    recoverySession: {
      accessToken,
      refreshToken,
    },
    errorMessage: null,
  };
}

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
  const [recoverySession, setRecoverySession] = React.useState<RecoverySession | null>(null);
  const [tokenStatus, setTokenStatus] = React.useState<{
    valid: boolean;
    status: string;
    message: string;
  } | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (typeof window !== "undefined") {
        const hashResult = parseRecoverySessionFromHash(window.location.hash);

        if (hashResult.errorMessage) {
          if (!cancelled) {
            setTokenStatus({
              valid: false,
              status: "invalid",
              message: hashResult.errorMessage,
            });
          }

          return;
        }

        if (hashResult.recoverySession) {
          if (!cancelled) {
            setRecoverySession(hashResult.recoverySession);
            setTokenStatus({
              valid: true,
              status: "valid",
              message: "Choose a new password for your account.",
            });
          }

          window.history.replaceState(
            null,
            "",
            `${window.location.pathname}${window.location.search}`
          );
          return;
        }
      }

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
            <ResetPasswordForm
              token={search.token ?? search.token_hash ?? ""}
              recoverySession={recoverySession}
            />
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
