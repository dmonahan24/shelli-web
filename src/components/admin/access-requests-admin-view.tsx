import * as React from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { AccessRequestStatusBadge } from "@/components/admin/access-request-status-badge";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { appUserRoleValues, type AppUserRole } from "@/lib/auth/principal";
import { formatDateTime } from "@/lib/utils/format";
import {
  approveAccessRequestServerFn,
  rejectAccessRequestServerFn,
} from "@/server/admin/access-requests";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

export function AccessRequestsAdminView({
  data,
}: {
  data: {
    companies: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
    requests: Array<{
      id: string;
      authUserId: string;
      email: string;
      fullName: string;
      status: "pending" | "approved" | "rejected";
      requestedAt: string | Date;
      resolvedAt: string | Date | null;
      resolvedByPlatformAdminId: string | null;
      targetCompanyId: string | null;
      targetRole: AppUserRole | null;
      notes: string | null;
      companyName: string | null;
      resolvedByName: string | null;
    }>;
  };
}) {
  const pendingCount = data.requests.filter((request) => request.status === "pending").length;

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Access Requests"
        subtitle="Review valid Supabase accounts that still need a company profile, then approve them into an existing tenant or create a new company inline."
      />
      <Card className="rounded-[24px] border-border/80 bg-card/90 shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-3 p-5 text-sm text-muted-foreground">
          <span>{pendingCount} pending</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>{data.requests.length} total requests</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>{data.companies.length} available companies</span>
        </CardContent>
      </Card>
      <div className="space-y-5">
        {data.requests.length > 0 ? (
          data.requests.map((request) => (
            <AccessRequestCard
              key={request.id}
              companies={data.companies}
              request={request}
            />
          ))
        ) : (
          <Card className="rounded-[28px] border-border/80 bg-card/90 shadow-sm">
            <CardContent className="p-6 text-sm text-muted-foreground">
              No access requests are waiting right now.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function AccessRequestCard({
  companies,
  request,
}: {
  companies: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  request: {
    id: string;
    authUserId: string;
    email: string;
    fullName: string;
    status: "pending" | "approved" | "rejected";
    requestedAt: string | Date;
    resolvedAt: string | Date | null;
    resolvedByPlatformAdminId: string | null;
    targetCompanyId: string | null;
    targetRole: AppUserRole | null;
    notes: string | null;
    companyName: string | null;
    resolvedByName: string | null;
  };
}) {
  const router = useRouter();
  const [companyProvisionMode, setCompanyProvisionMode] = React.useState<"existing" | "new">(
    request.targetCompanyId ? "existing" : "existing"
  );
  const [companyId, setCompanyId] = React.useState(request.targetCompanyId ?? "");
  const [newCompanyName, setNewCompanyName] = React.useState("");
  const [newCompanySlug, setNewCompanySlug] = React.useState("");
  const [targetRole, setTargetRole] = React.useState<AppUserRole>(
    request.targetRole ?? "admin"
  );
  const [approveNotes, setApproveNotes] = React.useState(request.notes ?? "");
  const [rejectNotes, setRejectNotes] = React.useState(request.notes ?? "");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [isApproving, startApprove] = React.useTransition();
  const [isRejecting, startReject] = React.useTransition();

  const isResolved = request.status !== "pending";

  return (
    <Card className="rounded-[28px] border-border/80 bg-card/90 shadow-sm">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-xl">{request.fullName}</CardTitle>
            <p className="text-sm text-muted-foreground">{request.email}</p>
            <p className="text-xs text-muted-foreground">
              Requested {formatDateTime(request.requestedAt)}
            </p>
          </div>
          <AccessRequestStatusBadge status={request.status} />
        </div>
        {isResolved ? (
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
            <p>
              {request.status === "approved" ? "Assigned to" : "Reviewed"}
              {request.companyName ? ` ${request.companyName}` : ""}.
            </p>
            {request.targetRole ? (
              <p>Role: {request.targetRole.replaceAll("_", " ")}</p>
            ) : null}
            {request.resolvedByName ? <p>Resolved by {request.resolvedByName}.</p> : null}
            {request.resolvedAt ? <p>Resolved {formatDateTime(request.resolvedAt)}.</p> : null}
            {request.notes ? <p className="mt-2 whitespace-pre-wrap">{request.notes}</p> : null}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        {!isResolved ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="space-y-4 rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="space-y-1">
                <p className="font-medium">Approve and assign</p>
                <p className="text-sm text-muted-foreground">
                  Attach this auth user to an existing company or create one now.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Company mode</p>
                  <Select
                    value={companyProvisionMode}
                    onValueChange={(value: "existing" | "new") => setCompanyProvisionMode(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="existing">Assign to existing company</SelectItem>
                      <SelectItem value="new">Create new company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tenant role</p>
                  <Select
                    value={targetRole}
                    onValueChange={(value: AppUserRole) => setTargetRole(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {appUserRoleValues.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.replaceAll("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={fieldErrors.targetRole} />
                </div>
              </div>

              {companyProvisionMode === "existing" ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Company</p>
                  <Select value={companyId} onValueChange={setCompanyId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={fieldErrors.companyId} />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">New company name</p>
                    <Input
                      placeholder="Acme Concrete"
                      value={newCompanyName}
                      onChange={(event) => setNewCompanyName(event.target.value)}
                    />
                    <FieldError message={fieldErrors.newCompanyName} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">New company slug</p>
                    <Input
                      placeholder="acme-concrete"
                      value={newCompanySlug}
                      onChange={(event) => setNewCompanySlug(event.target.value)}
                    />
                    <FieldError message={fieldErrors.newCompanySlug} />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Approval notes</p>
                <Textarea
                  placeholder="Optional internal note for this provisioning decision."
                  value={approveNotes}
                  onChange={(event) => setApproveNotes(event.target.value)}
                />
                <FieldError message={fieldErrors.notes} />
              </div>

              <Button
                className="w-full sm:w-auto"
                onClick={() =>
                  startApprove(async () => {
                    const result = await approveAccessRequestServerFn({
                      data: {
                        requestId: request.id,
                        companyProvisionMode,
                        companyId,
                        newCompanyName,
                        newCompanySlug,
                        targetRole,
                        notes: approveNotes,
                      },
                    });

                    if (!result.ok) {
                      setFieldErrors((result.fieldErrors ?? {}) as Record<string, string>);
                      if (!result.fieldErrors) {
                        toast.error(result.formError ?? "Unable to approve access request.");
                      }
                      return;
                    }

                    setFieldErrors({});
                    toast.success(result.message ?? "Access request approved.");
                    await router.invalidate();
                  })
                }
                disabled={isApproving}
              >
                {isApproving ? "Approving..." : "Approve And Assign"}
              </Button>
            </div>

            <div className="space-y-4 rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="space-y-1">
                <p className="font-medium">Reject request</p>
                <p className="text-sm text-muted-foreground">
                  Keep the account out of tenant routes and record why it was declined.
                </p>
              </div>
              <Textarea
                placeholder="Optional reason shown in the pending-access screen."
                value={rejectNotes}
                onChange={(event) => setRejectNotes(event.target.value)}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  startReject(async () => {
                    const result = await rejectAccessRequestServerFn({
                      data: {
                        requestId: request.id,
                        notes: rejectNotes,
                      },
                    });

                    if (!result.ok) {
                      toast.error(result.formError ?? "Unable to reject access request.");
                      return;
                    }

                    toast.success(result.message ?? "Access request rejected.");
                    await router.invalidate();
                  })
                }
                disabled={isRejecting}
              >
                {isRejecting ? "Rejecting..." : "Reject Request"}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
