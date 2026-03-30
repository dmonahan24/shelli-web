import * as React from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { AccessRequestStatusBadge } from "@/components/admin/access-request-status-badge";
import { AdminUserStatusBadge } from "@/components/admin/admin-user-status-badge";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Badge } from "@/components/ui/badge";
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
import {
  appUserRoleValues,
  type AdminUserStatus,
  type AppUserRole,
} from "@/lib/auth/principal";
import { formatDateTime } from "@/lib/utils/format";
import { grantPlatformAdminServerFn, revokePlatformAdminServerFn } from "@/server/admin/platform-admins";
import {
  toggleAdminUserActiveServerFn,
  updateAdminUserAccessServerFn,
} from "@/server/admin/users";

const userStatusFilterOptions: Array<{ label: string; value: AdminUserStatus | "all" }> = [
  { label: "All statuses", value: "all" },
  { label: "Not assigned", value: "unassigned_auth_user" },
  { label: "Pending access", value: "pending_access" },
  { label: "Tenant active", value: "tenant_active" },
  { label: "Tenant inactive", value: "tenant_inactive" },
  { label: "Platform admin", value: "platform_admin" },
];

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

export function AdminUsersView({
  data,
}: {
  data: {
    companies: Array<{
      id: string;
      name: string;
      slug: string;
      isActive: boolean;
    }>;
    users: Array<{
      authUserId: string;
      email: string;
      fullName: string;
      companyId: string | null;
      companyName: string | null;
      companyIsActive: boolean | null;
      role: AppUserRole | null;
      userStatus: AdminUserStatus;
      tenantIsActive: boolean | null;
      platformAdminIsActive: boolean;
      accessRequestStatus: "pending" | "approved" | "rejected" | null;
      accessRequestNotes: string | null;
      accessRequestedAt: string | Date | null;
      accessResolvedAt: string | Date | null;
      lastSignInAt: string | null;
    }>;
  };
}) {
  const [searchValue, setSearchValue] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<AdminUserStatus | "all">("all");
  const [companyFilter, setCompanyFilter] = React.useState<string>("all");
  const [roleFilter, setRoleFilter] = React.useState<AppUserRole | "all">("all");

  const filteredUsers = data.users.filter((user) => {
    const matchesSearch =
      searchValue.trim().length === 0 ||
      user.fullName.toLowerCase().includes(searchValue.toLowerCase()) ||
      user.email.toLowerCase().includes(searchValue.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.userStatus === statusFilter;
    const matchesCompany = companyFilter === "all" || user.companyId === companyFilter;
    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesStatus && matchesCompany && matchesRole;
  });

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="User Directory"
        subtitle="Find any authenticated user, assign company access, adjust tenant status, and manage platform-admin permissions from one place."
      />

      <Card className="rounded-[24px] border-border/80 bg-card/90 shadow-sm">
        <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          <Input
            placeholder="Search by name or email"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
          <Select value={statusFilter} onValueChange={(value: AdminUserStatus | "all") => setStatusFilter(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {userStatusFilterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All companies</SelectItem>
              {data.companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={(value: AppUserRole | "all") => setRoleFilter(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {appUserRoleValues.map((role) => (
                <SelectItem key={role} value={role}>
                  {role.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="space-y-5">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <AdminUserCard key={user.authUserId} user={user} companies={data.companies} />
          ))
        ) : (
          <Card className="rounded-[28px] border-border/80 bg-card/90 shadow-sm">
            <CardContent className="p-6 text-sm text-muted-foreground">
              No users matched the current filters.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function AdminUserCard({
  user,
  companies,
}: {
  user: {
    authUserId: string;
    email: string;
    fullName: string;
    companyId: string | null;
    companyName: string | null;
    companyIsActive: boolean | null;
    role: AppUserRole | null;
    userStatus: AdminUserStatus;
    tenantIsActive: boolean | null;
    platformAdminIsActive: boolean;
    accessRequestStatus: "pending" | "approved" | "rejected" | null;
    accessRequestNotes: string | null;
    accessRequestedAt: string | Date | null;
    accessResolvedAt: string | Date | null;
    lastSignInAt: string | null;
  };
  companies: Array<{
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  }>;
}) {
  const router = useRouter();
  const activeCompanies = companies.filter((company) => company.isActive);
  const [companyId, setCompanyId] = React.useState(user.companyId ?? activeCompanies[0]?.id ?? "");
  const [role, setRole] = React.useState<AppUserRole>(user.role ?? "admin");
  const [fullNameOverride, setFullNameOverride] = React.useState("");
  const [accessNotes, setAccessNotes] = React.useState("");
  const [statusNotes, setStatusNotes] = React.useState("");
  const [platformAdminNotes, setPlatformAdminNotes] = React.useState("");
  const [accessErrors, setAccessErrors] = React.useState<Record<string, string>>({});
  const [statusErrors, setStatusErrors] = React.useState<Record<string, string>>({});
  const [platformErrors, setPlatformErrors] = React.useState<Record<string, string>>({});
  const [isSavingAccess, startSaveAccess] = React.useTransition();
  const [isUpdatingStatus, startUpdateStatus] = React.useTransition();
  const [isUpdatingPlatformAdmin, startUpdatePlatformAdmin] = React.useTransition();

  React.useEffect(() => {
    if (!companyId && activeCompanies[0]?.id) {
      setCompanyId(activeCompanies[0].id);
    }
  }, [activeCompanies, companyId]);

  return (
    <Card className="rounded-[28px] border-border/80 bg-card/90 shadow-sm">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-xl">{user.fullName}</CardTitle>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex flex-wrap items-center gap-2">
              <AdminUserStatusBadge status={user.userStatus} />
              {user.accessRequestStatus ? (
                <AccessRequestStatusBadge status={user.accessRequestStatus} />
              ) : null}
              {user.role ? (
                <Badge variant="secondary">{user.role.replaceAll("_", " ")}</Badge>
              ) : null}
              {user.companyName ? (
                <Badge variant={user.companyIsActive ? "outline" : "secondary"}>
                  {user.companyName}
                </Badge>
              ) : null}
            </div>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            {user.lastSignInAt ? <p>Last sign in {formatDateTime(user.lastSignInAt)}</p> : null}
            {user.accessRequestedAt ? <p>Requested {formatDateTime(user.accessRequestedAt)}</p> : null}
            {user.accessResolvedAt ? <p>Reviewed {formatDateTime(user.accessResolvedAt)}</p> : null}
          </div>
        </div>
        {user.accessRequestNotes ? (
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Access request notes</p>
            <p className="mt-2 whitespace-pre-wrap">{user.accessRequestNotes}</p>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-4 rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="space-y-1">
              <p className="font-medium">Tenant access</p>
              <p className="text-sm text-muted-foreground">
                Assign, reassign, or update the tenant role for this auth user.
              </p>
            </div>
            <div className="space-y-2">
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a company" />
                </SelectTrigger>
                <SelectContent>
                  {activeCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={accessErrors.companyId} />
            </div>
            <div className="space-y-2">
              <Select value={role} onValueChange={(value: AppUserRole) => setRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {appUserRoleValues.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={accessErrors.role} />
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Optional full name override"
                value={fullNameOverride}
                onChange={(event) => setFullNameOverride(event.target.value)}
              />
              <FieldError message={accessErrors.fullName} />
            </div>
            <div className="space-y-2">
              <Textarea
                placeholder="Add a note for reassignment or other important changes."
                value={accessNotes}
                onChange={(event) => setAccessNotes(event.target.value)}
              />
              <FieldError message={accessErrors.notes} />
            </div>
            <Button
              className="w-full"
              onClick={() =>
                startSaveAccess(async () => {
                  const isReassignment = Boolean(user.companyId && user.companyId !== companyId);
                  if (isReassignment) {
                    const confirmed = window.confirm(
                      "Reassign this user to another company? Their tenant access will move with them."
                    );
                    if (!confirmed) {
                      return;
                    }
                  }

                  const result = await updateAdminUserAccessServerFn({
                    data: {
                      authUserId: user.authUserId,
                      companyId,
                      role,
                      fullName: fullNameOverride,
                      notes: accessNotes,
                    },
                  });

                  if (!result.ok) {
                    setAccessErrors((result.fieldErrors ?? {}) as Record<string, string>);
                    toast.error(result.formError ?? "Unable to update tenant access.");
                    return;
                  }

                  setAccessErrors({});
                  setAccessNotes("");
                  setFullNameOverride("");
                  toast.success(result.message ?? "Tenant access updated.");
                  await router.invalidate();
                })
              }
              disabled={isSavingAccess || activeCompanies.length === 0}
            >
              {isSavingAccess ? "Saving..." : "Save Tenant Access"}
            </Button>
          </div>

          <div className="space-y-4 rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="space-y-1">
              <p className="font-medium">Tenant status</p>
              <p className="text-sm text-muted-foreground">
                Deactivate a tenant user to block dashboard access without deleting records.
              </p>
            </div>
            <div className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
              <p>
                Current status:{" "}
                <span className="font-medium text-foreground">
                  {user.tenantIsActive === null
                    ? "No tenant profile"
                    : user.tenantIsActive
                      ? "Active"
                      : "Inactive"}
                </span>
              </p>
            </div>
            <div className="space-y-2">
              <Textarea
                placeholder="Required note for reactivation or deactivation."
                value={statusNotes}
                onChange={(event) => setStatusNotes(event.target.value)}
              />
              <FieldError message={statusErrors.notes} />
            </div>
            <Button
              variant={user.tenantIsActive ? "outline" : "default"}
              className="w-full"
              onClick={() =>
                startUpdateStatus(async () => {
                  if (user.tenantIsActive === null) {
                    toast.error("Assign tenant access before changing active status.");
                    return;
                  }

                  const confirmed = window.confirm(
                    user.tenantIsActive
                      ? "Deactivate this tenant user and block sign-in to tenant routes?"
                      : "Reactivate this tenant user?"
                  );

                  if (!confirmed) {
                    return;
                  }

                  const result = await toggleAdminUserActiveServerFn({
                    data: {
                      authUserId: user.authUserId,
                      isActive: !user.tenantIsActive,
                      notes: statusNotes,
                    },
                  });

                  if (!result.ok) {
                    setStatusErrors((result.fieldErrors ?? {}) as Record<string, string>);
                    toast.error(result.formError ?? "Unable to update tenant status.");
                    return;
                  }

                  setStatusErrors({});
                  setStatusNotes("");
                  toast.success(result.message ?? "Tenant status updated.");
                  await router.invalidate();
                })
              }
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus
                ? user.tenantIsActive
                  ? "Deactivating..."
                  : "Reactivating..."
                : user.tenantIsActive
                  ? "Deactivate Tenant User"
                  : "Reactivate Tenant User"}
            </Button>
          </div>

          <div className="space-y-4 rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="space-y-1">
              <p className="font-medium">Platform access</p>
              <p className="text-sm text-muted-foreground">
                Grant or revoke global superuser access for this authenticated user.
              </p>
            </div>
            <div className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
              <p>
                Current status:{" "}
                <span className="font-medium text-foreground">
                  {user.platformAdminIsActive ? "Platform admin" : "Standard auth user"}
                </span>
              </p>
            </div>
            <div className="space-y-2">
              <Textarea
                placeholder="Required note when revoking platform-admin access."
                value={platformAdminNotes}
                onChange={(event) => setPlatformAdminNotes(event.target.value)}
              />
              <FieldError message={platformErrors.notes} />
            </div>
            <Button
              variant={user.platformAdminIsActive ? "outline" : "default"}
              className="w-full"
              onClick={() =>
                startUpdatePlatformAdmin(async () => {
                  if (user.platformAdminIsActive) {
                    const confirmed = window.confirm(
                      "Revoke platform-admin access for this user?"
                    );
                    if (!confirmed) {
                      return;
                    }

                    const result = await revokePlatformAdminServerFn({
                      data: {
                        platformAdminId: user.authUserId,
                        notes: platformAdminNotes,
                      },
                    });

                    if (!result.ok) {
                      setPlatformErrors((result.fieldErrors ?? {}) as Record<string, string>);
                      toast.error(result.formError ?? "Unable to revoke platform admin access.");
                      return;
                    }
                  } else {
                    const result = await grantPlatformAdminServerFn({
                      data: {
                        email: user.email,
                        fullName: user.fullName,
                      },
                    });

                    if (!result.ok) {
                      setPlatformErrors((result.fieldErrors ?? {}) as Record<string, string>);
                      toast.error(result.formError ?? "Unable to grant platform admin access.");
                      return;
                    }
                  }

                  setPlatformErrors({});
                  setPlatformAdminNotes("");
                  toast.success(
                    user.platformAdminIsActive
                      ? "Platform admin access revoked."
                      : "Platform admin access granted."
                  );
                  await router.invalidate();
                })
              }
              disabled={isUpdatingPlatformAdmin || !user.email}
            >
              {isUpdatingPlatformAdmin
                ? user.platformAdminIsActive
                  ? "Revoking..."
                  : "Granting..."
                : user.platformAdminIsActive
                  ? "Revoke Platform Admin"
                  : "Grant Platform Admin"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
