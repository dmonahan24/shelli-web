import * as React from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { ArrowRight, Building2, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AccessRequestStatusBadge } from "@/components/admin/access-request-status-badge";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils/format";
import { grantPlatformAdminServerFn } from "@/server/admin/platform-admins";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

export function AdminDashboardView({
  data,
}: {
  data: {
    overview: {
      pendingRequests: number;
      companyCount: number;
      platformAdminCount: number;
    };
    recentAccessRequests: Array<{
      id: string;
      email: string;
      fullName: string;
      requestedAt: string | Date;
      status: "pending" | "approved" | "rejected";
    }>;
    platformAdmins: Array<{
      id: string;
      email: string;
      fullName: string;
      isActive: boolean;
      createdAt: string | Date;
    }>;
  };
}) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [isPending, startTransition] = React.useTransition();

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Platform Admin"
        subtitle="Provision companies, review pending access, and maintain the small set of users who can manage tenant assignments."
        action={
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to="/admin/access-requests">Review Requests</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/users">Manage Users</Link>
            </Button>
            <Button asChild>
              <Link to="/admin/companies">Manage Companies</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <OverviewCard
          icon={<UserPlus className="size-5" />}
          label="Pending requests"
          value={String(data.overview.pendingRequests)}
        />
        <OverviewCard
          icon={<Building2 className="size-5" />}
          label="Companies"
          value={String(data.overview.companyCount)}
        />
        <OverviewCard
          icon={<ShieldCheck className="size-5" />}
          label="Platform admins"
          value={String(data.overview.platformAdminCount)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,1fr)]">
        <Card className="rounded-[28px] border-border/80 bg-card/90 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Recent access requests</CardTitle>
              <p className="text-sm text-muted-foreground">
                New Supabase accounts land here until a company profile is assigned.
              </p>
            </div>
            <Button asChild variant="ghost" className="px-0">
              <Link to="/admin/access-requests">
                Open queue
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recentAccessRequests.length > 0 ? (
              data.recentAccessRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{request.fullName}</p>
                    <p className="text-sm text-muted-foreground">{request.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested {formatDateTime(request.requestedAt)}
                    </p>
                  </div>
                  <AccessRequestStatusBadge status={request.status} />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No access requests have been recorded yet.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-border/80 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>Grant platform admin</CardTitle>
              <p className="text-sm text-muted-foreground">
                Promote an existing Supabase Auth user into the provisioning console.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <FieldError message={fieldErrors.email} />
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="Full name (optional)"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
                <FieldError message={fieldErrors.fullName} />
              </div>
              <Button
                className="w-full"
                onClick={() =>
                  startTransition(async () => {
                    const result = await grantPlatformAdminServerFn({
                      data: {
                        email,
                        fullName,
                      },
                    });

                    if (!result.ok) {
                      setFieldErrors((result.fieldErrors ?? {}) as Record<string, string>);
                      toast.error(result.formError ?? "Unable to grant platform admin access.");
                      return;
                    }

                    setFieldErrors({});
                    setEmail("");
                    setFullName("");
                    toast.success(result.message ?? "Platform admin granted.");
                    await router.invalidate();
                  })
                }
                disabled={isPending}
              >
                {isPending ? "Granting access..." : "Grant Platform Admin"}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-border/80 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>Current platform admins</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.platformAdmins.map((platformAdmin) => (
                <div
                  key={platformAdmin.id}
                  className="rounded-2xl border border-border/70 bg-background/70 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium">{platformAdmin.fullName}</p>
                      <p className="text-sm text-muted-foreground">{platformAdmin.email}</p>
                    </div>
                    <AccessRequestStatusBadge
                      status={platformAdmin.isActive ? "approved" : "rejected"}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Added {formatDateTime(platformAdmin.createdAt)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function OverviewCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-[24px] border-border/80 bg-card/90 shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
