import * as React from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createCompanyServerFn,
  toggleCompanyArchivedServerFn,
  updateCompanyServerFn,
} from "@/server/admin/companies";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

export function CompaniesAdminView({
  companies,
}: {
  companies: Array<{
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: string | Date;
    users: Array<{
      id: string;
      companyId: string;
      email: string;
      fullName: string;
      role: string;
      isActive: boolean;
    }>;
  }>;
}) {
  const router = useRouter();
  const [companyName, setCompanyName] = React.useState("");
  const [companySlug, setCompanySlug] = React.useState("");
  const [companyFieldErrors, setCompanyFieldErrors] = React.useState<Record<string, string>>({});
  const [isCreatingCompany, startCreateCompany] = React.useTransition();

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Companies"
        subtitle="Create, update, archive, and review tenant companies while keeping rosters visible and audit-friendly."
        action={
          <Button asChild variant="outline">
            <Link to="/admin/users">Open User Directory</Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card className="rounded-[28px] border-border/80 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Create company</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add a tenant container before assigning users into it.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Acme Concrete"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
              />
              <FieldError message={companyFieldErrors.name} />
            </div>
            <div className="space-y-2">
              <Input
                placeholder="acme-concrete"
                value={companySlug}
                onChange={(event) => setCompanySlug(event.target.value)}
              />
              <FieldError message={companyFieldErrors.slug} />
            </div>
            <Button
              className="w-full"
              onClick={() =>
                startCreateCompany(async () => {
                  const result = await createCompanyServerFn({
                    data: {
                      name: companyName,
                      slug: companySlug,
                    },
                  });

                  if (!result.ok) {
                    setCompanyFieldErrors((result.fieldErrors ?? {}) as Record<string, string>);
                    if (!result.fieldErrors) {
                      toast.error(result.formError ?? "Unable to create company.");
                    }
                    return;
                  }

                  setCompanyFieldErrors({});
                  setCompanyName("");
                  setCompanySlug("");
                  toast.success(result.message ?? "Company created.");
                  await router.invalidate();
                })
              }
              disabled={isCreatingCompany}
            >
              {isCreatingCompany ? "Creating company..." : "Create Company"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-5">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CompanyCard({
  company,
}: {
  company: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: string | Date;
    users: Array<{
      id: string;
      companyId: string;
      email: string;
      fullName: string;
      role: string;
      isActive: boolean;
    }>;
  };
}) {
  const router = useRouter();
  const [name, setName] = React.useState(company.name);
  const [slug, setSlug] = React.useState(company.slug);
  const [editNotes, setEditNotes] = React.useState("");
  const [archiveNotes, setArchiveNotes] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [isSaving, startSave] = React.useTransition();
  const [isArchiving, startArchive] = React.useTransition();

  return (
    <Card className="rounded-[28px] border-border/80 bg-card/90 shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <CardTitle>{company.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{company.slug}</p>
          </div>
          <Badge variant={company.isActive ? "default" : "secondary"}>
            {company.isActive ? "Active company" : "Archived company"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
          <div className="space-y-4 rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="space-y-1">
              <p className="font-medium">Company details</p>
              <p className="text-sm text-muted-foreground">
                Update the company record without changing historical operational data.
              </p>
            </div>
            <div className="space-y-2">
              <Input value={name} onChange={(event) => setName(event.target.value)} />
              <FieldError message={fieldErrors.name} />
            </div>
            <div className="space-y-2">
              <Input value={slug} onChange={(event) => setSlug(event.target.value)} />
              <FieldError message={fieldErrors.slug} />
            </div>
            <div className="space-y-2">
              <Textarea
                placeholder="Optional note for this company update."
                value={editNotes}
                onChange={(event) => setEditNotes(event.target.value)}
              />
              <FieldError message={fieldErrors.notes} />
            </div>
            <Button
              className="w-full sm:w-auto"
              onClick={() =>
                startSave(async () => {
                  const result = await updateCompanyServerFn({
                    data: {
                      companyId: company.id,
                      name,
                      slug,
                      notes: editNotes,
                    },
                  });

                  if (!result.ok) {
                    setFieldErrors((result.fieldErrors ?? {}) as Record<string, string>);
                    toast.error(result.formError ?? "Unable to update company.");
                    return;
                  }

                  setFieldErrors({});
                  setEditNotes("");
                  toast.success(result.message ?? "Company updated.");
                  await router.invalidate();
                })
              }
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Company"}
            </Button>
          </div>

          <div className="space-y-4 rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="space-y-1">
              <p className="font-medium">{company.isActive ? "Archive company" : "Restore company"}</p>
              <p className="text-sm text-muted-foreground">
                Archiving preserves records but blocks new assignments into the tenant.
              </p>
            </div>
            <Textarea
              placeholder="Required note for archive or restore."
              value={archiveNotes}
              onChange={(event) => setArchiveNotes(event.target.value)}
            />
            <Button
              variant={company.isActive ? "outline" : "default"}
              className="w-full"
              onClick={() =>
                startArchive(async () => {
                  const confirmed = window.confirm(
                    company.isActive
                      ? "Archive this company? New user assignments will be blocked."
                      : "Restore this company and allow new user assignments again?"
                  );

                  if (!confirmed) {
                    return;
                  }

                  const result = await toggleCompanyArchivedServerFn({
                    data: {
                      companyId: company.id,
                      shouldArchive: company.isActive,
                      notes: archiveNotes,
                    },
                  });

                  if (!result.ok) {
                    setFieldErrors((result.fieldErrors ?? {}) as Record<string, string>);
                    toast.error(result.formError ?? "Unable to update company status.");
                    return;
                  }

                  setFieldErrors({});
                  setArchiveNotes("");
                  toast.success(result.message ?? "Company status updated.");
                  await router.invalidate();
                })
              }
              disabled={isArchiving}
            >
              {isArchiving
                ? company.isActive
                  ? "Archiving..."
                  : "Restoring..."
                : company.isActive
                  ? "Archive Company"
                  : "Restore Company"}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Current roster</p>
              <p className="text-sm text-muted-foreground">
                Review who is attached to this company. Use the user directory for assignment changes.
              </p>
            </div>
            <Button asChild variant="ghost" className="px-0">
              <Link to="/admin/users">Manage Users</Link>
            </Button>
          </div>
          {company.users.length > 0 ? (
            company.users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{user.role.replaceAll("_", " ")}</Badge>
                  <Badge variant={user.isActive ? "default" : "destructive"}>
                    {user.isActive ? "active" : "inactive"}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No tenant users have been assigned yet.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
