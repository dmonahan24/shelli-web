import * as React from "react";
import { toast } from "sonner";
import { AlertCircle, Plus, UserPlus, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { appUserRoleValues, projectRoleValues } from "@/lib/auth/principal";
import { bulkAssignProjectMembersServerFn } from "@/server/company/bulk-assign-project-members";

type ActiveProjectMember = {
  userId: string;
  fullName: string;
  email: string;
  companyRole: string;
  projectRole: string;
  isProjectManager: boolean;
  isSuperintendent: boolean;
};

type PendingProjectInvite = {
  invitationId: string;
  email: string;
  companyRole: string;
  projectRole: string;
  expiresAt: Date;
  invitedByName: string;
};

type AvailableProjectMember = {
  userId: string;
  fullName: string;
  email: string;
  companyRole: string;
};

type InviteDraft = {
  id: string;
  email: string;
  companyRole: (typeof appUserRoleValues)[number];
  projectRole: (typeof projectRoleValues)[number];
};

export function ProjectMemberRoleSelect({
  onChange,
  value,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {projectRoleValues.map((role) => (
          <SelectItem key={role} value={role}>
            {role.replaceAll("_", " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CompanyRoleSelect({
  onChange,
  value,
}: {
  value: string;
  onChange: (value: (typeof appUserRoleValues)[number]) => void;
}) {
  return (
    <Select value={value} onValueChange={(nextValue) => onChange(nextValue as (typeof appUserRoleValues)[number])}>
      <SelectTrigger>
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
  );
}

function createInviteDraft(): InviteDraft {
  return {
    id: crypto.randomUUID(),
    email: "",
    companyRole: "viewer",
    projectRole: "viewer",
  };
}

export function AssignProjectMemberDialog({
  projectId,
  projectName,
  activeMembers,
  pendingInvitees,
  availableMembers,
  hasExplicitAssignments,
  currentProjectManagerUserId,
  currentSuperintendentUserId,
  onComplete,
}: {
  projectId: string;
  projectName: string;
  activeMembers: ActiveProjectMember[];
  pendingInvitees: PendingProjectInvite[];
  availableMembers: AvailableProjectMember[];
  hasExplicitAssignments: boolean;
  currentProjectManagerUserId: string | null;
  currentSuperintendentUserId: string | null;
  onComplete?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = React.useState<
    Record<string, (typeof projectRoleValues)[number]>
  >({});
  const [inviteRows, setInviteRows] = React.useState<InviteDraft[]>([]);
  const [projectManagerUserId, setProjectManagerUserId] = React.useState("");
  const [superintendentUserId, setSuperintendentUserId] = React.useState("");

  const resetState = React.useCallback(() => {
    setSelectedUserIds([]);
    setSelectedRoles({});
    setInviteRows([]);
    setProjectManagerUserId("");
    setSuperintendentUserId("");
  }, []);

  React.useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  const selectedAvailableMembers = availableMembers.filter((member) =>
    selectedUserIds.includes(member.userId)
  );

  const eligibleProjectManagers = [...activeMembers, ...selectedAvailableMembers].filter(
    (member) => member.companyRole === "project_manager"
  );
  const eligibleSuperintendents = [...activeMembers, ...selectedAvailableMembers].filter(
    (member) => member.companyRole === "field_supervisor"
  );

  const toggleMember = (userId: string, checked: boolean) => {
    setSelectedUserIds((current) =>
      checked ? [...current, userId] : current.filter((value) => value !== userId)
    );

    setSelectedRoles((current) => {
      if (checked) {
        return {
          ...current,
          [userId]: current[userId] ?? "viewer",
        };
      }

      const next = { ...current };
      delete next[userId];
      return next;
    });
  };

  const updateInviteRow = (inviteId: string, update: Partial<InviteDraft>) => {
    setInviteRows((current) =>
      current.map((row) => (row.id === inviteId ? { ...row, ...update } : row))
    );
  };

  const removeInviteRow = (inviteId: string) => {
    setInviteRows((current) => current.filter((row) => row.id !== inviteId));
  };

  const onSubmit = () => {
    const assignments = [
      ...selectedAvailableMembers.map((member) => ({
        userId: member.userId,
        projectRole: selectedRoles[member.userId] ?? "viewer",
      })),
      ...inviteRows
        .map((row) => ({
          email: row.email.trim(),
          companyRole: row.companyRole,
          projectRole: row.projectRole,
        }))
        .filter((row) => row.email.length > 0),
    ];

    startTransition(async () => {
      const result = await bulkAssignProjectMembersServerFn({
        data: {
          projectId,
          assignments,
          projectManagerUserId,
          superintendentUserId,
        },
      });

      if (!result.ok) {
        toast.error(result.formError ?? "Unable to update project access.");
        return;
      }

      toast.success(result.message ?? "Project access saved.");
      setOpen(false);
      onComplete?.();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="size-4" />
          Add Team Members
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Manage Project Access</DialogTitle>
          <DialogDescription>
            Add existing company members to {projectName}, or invite new teammates and queue their
            access after they accept.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {!hasExplicitAssignments ? (
            <Alert>
              <AlertCircle className="size-4" />
              <AlertTitle>Explicit project access starts with this batch</AlertTitle>
              <AlertDescription>
                After the first explicit assignment, lower-privilege company users will only see
                this project if they are assigned to it.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Existing Company Members</h3>
                    <p className="text-sm text-muted-foreground">
                      Select active company members and choose a project role for each.
                    </p>
                  </div>
                  <Badge variant="secondary">{availableMembers.length} available</Badge>
                </div>
                <ScrollArea className="h-72 rounded-xl border border-border/60">
                  <div className="space-y-3 p-3">
                    {availableMembers.length > 0 ? (
                      availableMembers.map((member) => {
                        const checked = selectedUserIds.includes(member.userId);

                        return (
                          <div
                            key={member.userId}
                            className="rounded-xl border border-border/60 p-3"
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(nextChecked) =>
                                  toggleMember(member.userId, nextChecked === true)
                                }
                              />
                              <div className="min-w-0 flex-1 space-y-3">
                                <div>
                                  <p className="font-medium">{member.fullName}</p>
                                  <p className="text-sm text-muted-foreground">{member.email}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="secondary">
                                    {member.companyRole.replaceAll("_", " ")}
                                  </Badge>
                                </div>
                                {checked ? (
                                  <div className="max-w-xs">
                                    <ProjectMemberRoleSelect
                                      value={selectedRoles[member.userId] ?? "viewer"}
                                      onChange={(nextRole) =>
                                        setSelectedRoles((current) => ({
                                          ...current,
                                          [member.userId]: nextRole as (typeof projectRoleValues)[number],
                                        }))
                                      }
                                    />
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                        Everyone who can already be assigned to this project is already on the roster.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Invite New Teammates</h3>
                    <p className="text-sm text-muted-foreground">
                      Queue project access for people who are not company members yet.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setInviteRows((current) => [...current, createInviteDraft()])}
                  >
                    <Plus className="size-4" />
                    Add Invite
                  </Button>
                </div>
                <div className="space-y-3">
                  {inviteRows.length > 0 ? (
                    inviteRows.map((row) => (
                      <div key={row.id} className="rounded-xl border border-border/60 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="grid flex-1 gap-3 md:grid-cols-3">
                            <Input
                              type="email"
                              placeholder="teammate@company.com"
                              value={row.email}
                              onChange={(event) =>
                                updateInviteRow(row.id, { email: event.target.value })
                              }
                            />
                            <CompanyRoleSelect
                              value={row.companyRole}
                              onChange={(nextRole) =>
                                updateInviteRow(row.id, { companyRole: nextRole })
                              }
                            />
                            <ProjectMemberRoleSelect
                              value={row.projectRole}
                              onChange={(nextRole) =>
                                updateInviteRow(row.id, {
                                  projectRole: nextRole as (typeof projectRoleValues)[number],
                                })
                              }
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeInviteRow(row.id)}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                      No invite rows yet. Add one if this project needs people who are not in the
                      company workspace yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border/60 p-4">
                <h3 className="text-sm font-semibold">Leadership Sync</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Optionally update project leadership while saving access.
                </p>

                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Project Manager
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Current:{" "}
                      {activeMembers.find((member) => member.userId === currentProjectManagerUserId)
                        ?.fullName ?? "Unassigned"}
                    </p>
                    <Select value={projectManagerUserId} onValueChange={setProjectManagerUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Keep current assignment" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleProjectManagers.map((member) => (
                          <SelectItem key={member.userId} value={member.userId}>
                            {member.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Superintendent
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Current:{" "}
                      {activeMembers.find((member) => member.userId === currentSuperintendentUserId)
                        ?.fullName ?? "Unassigned"}
                    </p>
                    <Select value={superintendentUserId} onValueChange={setSuperintendentUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Keep current assignment" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleSuperintendents.map((member) => (
                          <SelectItem key={member.userId} value={member.userId}>
                            {member.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 p-4">
                <h3 className="text-sm font-semibold">Pending Invites</h3>
                <div className="mt-3 space-y-3">
                  {pendingInvitees.length > 0 ? (
                    pendingInvitees.map((invite) => (
                      <div key={invite.invitationId} className="rounded-xl border border-border/60 p-3">
                        <p className="font-medium">{invite.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Invited by {invite.invitedByName}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="secondary">
                            {invite.companyRole.replaceAll("_", " ")}
                          </Badge>
                          <Badge variant="outline">
                            {invite.projectRole.replaceAll("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No pending project invites right now.
                    </p>
                  )}
                </div>
              </div>

              <Button
                className="w-full"
                disabled={isPending}
                type="button"
                onClick={onSubmit}
              >
                Save Project Access
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
