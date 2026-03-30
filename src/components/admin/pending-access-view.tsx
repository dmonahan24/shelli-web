import * as React from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { Clock3, LogOut, RefreshCcw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { AccessRequestStatusBadge } from "@/components/admin/access-request-status-badge";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type PendingAccessPrincipal } from "@/lib/auth/principal";
import { formatDateTime } from "@/lib/utils/format";
import { logoutServerFn } from "@/server/auth/logout";

function getPendingAccessCopy(principal: PendingAccessPrincipal) {
  const status = principal.accessRequest?.status ?? "pending";

  if (status === "rejected") {
    return {
      title: "Access request reviewed",
      body:
        "Your account is signed in, but tenant access is still blocked. Review the notes below or contact the platform administrator who manages company assignments.",
    };
  }

  if (status === "approved") {
    return {
      title: "Access approved",
      body:
        "Your request has been approved. If you still cannot enter the dashboard, use Refresh Status or sign out and sign back in while the company profile finishes syncing.",
    };
  }

  return {
    title: "Access pending",
    body:
      "Your Supabase login is valid, but this account has not been assigned to a company profile yet. A platform administrator needs to create or attach your tenant profile before you can use project tools.",
  };
}

export function PendingAccessView({
  principal,
}: {
  principal: PendingAccessPrincipal;
}) {
  const navigate = useNavigate();
  const router = useRouter();
  const [isRefreshing, startRefresh] = React.useTransition();
  const [isSigningOut, startSignOut] = React.useTransition();
  const copy = getPendingAccessCopy(principal);

  return (
    <AuthPageShell title={copy.title} description={copy.body}>
      <div className="space-y-5">
        <Card className="rounded-[28px] border-border/80 bg-card/90 shadow-sm">
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                  <Clock3 className="size-5" />
                </div>
                <CardTitle className="text-xl">{principal.fullName}</CardTitle>
                <p className="text-sm text-muted-foreground">{principal.email}</p>
              </div>
              <AccessRequestStatusBadge
                status={principal.accessRequest?.status ?? "pending"}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>{copy.body}</p>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 size-4 text-primary" />
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Request details</p>
                  <p>
                    Requested{" "}
                    {principal.accessRequest?.requestedAt
                      ? formatDateTime(principal.accessRequest.requestedAt)
                      : "just now"}
                  </p>
                  {principal.accessRequest?.resolvedAt ? (
                    <p>
                      Last reviewed{" "}
                      {formatDateTime(principal.accessRequest.resolvedAt)}
                    </p>
                  ) : null}
                  {principal.accessRequest?.notes ? (
                    <p className="whitespace-pre-wrap rounded-xl bg-muted/60 p-3 text-foreground">
                      {principal.accessRequest.notes}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() =>
                  startRefresh(async () => {
                    await router.invalidate();
                    await navigate({ to: "/auth/pending-access", replace: true });
                  })
                }
                disabled={isRefreshing}
              >
                <RefreshCcw className="size-4" />
                {isRefreshing ? "Refreshing..." : "Refresh Status"}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  startSignOut(async () => {
                    const result = await logoutServerFn();
                    if (!result.ok) {
                      toast.error(result.formError ?? "Unable to sign out.");
                      return;
                    }

                    toast.success("Signed out.");
                    await navigate({ to: result.data.redirectTo });
                  })
                }
                disabled={isSigningOut}
              >
                <LogOut className="size-4" />
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthPageShell>
  );
}
