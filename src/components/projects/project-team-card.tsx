import * as React from "react";
import { AlertCircle, Plus, RotateCcw, X } from "lucide-react";
import { ProjectMemberRoleSelect } from "@/components/company/assign-project-member-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProjectRole } from "@/lib/auth/principal";
import type { ProjectTeamDraft } from "@/lib/project-team";

/** Radix selects cannot use "" as an item value, so the draft's "" maps to this. */
const UNASSIGNED_VALUE = "__unassigned__";

type TeamMember = {
  userId: string;
  fullName: string;
  email: string;
  companyRole: string;
};

export type ProjectTeamRoster = {
  hasExplicitAssignments: boolean;
  projectManagerUserId: string | null;
  superintendentUserId: string | null;
  projectAdminUserId: string | null;
  activeMembers: Array<TeamMember & { projectRole: string }>;
  availableMembers: TeamMember[];
};

export function ProjectTeamCard({
  roster,
  draft,
  onDraftChange,
}: {
  roster: ProjectTeamRoster;
  draft: ProjectTeamDraft;
  onDraftChange: (update: (current: ProjectTeamDraft) => ProjectTeamDraft) => void;
}) {
  const [pendingUserId, setPendingUserId] = React.useState("");
  const [pendingRole, setPendingRole] = React.useState<ProjectRole>("viewer");

  const availableById = new Map(roster.availableMembers.map((member) => [member.userId, member]));
  const additions = draft.additions.flatMap((addition) => {
    const member = availableById.get(addition.userId);
    return member ? [{ ...member, projectRole: addition.projectRole }] : [];
  });
  const addableMembers = roster.availableMembers.filter(
    (member) => !draft.additions.some((addition) => addition.userId === member.userId)
  );
  const teamMembers = [...roster.activeMembers, ...additions];
  // Someone marked for removal can no longer hold a leadership slot.
  const retainedMembers = teamMembers.filter((member) => !draft.removals.includes(member.userId));
  const eligibleProjectManagers = retainedMembers.filter(
    (member) => member.companyRole === "project_manager"
  );
  const eligibleSuperintendents = retainedMembers.filter(
    (member) => member.companyRole === "field_supervisor"
  );
  const eligibleProjectAdmins = retainedMembers.filter(
    (member) => member.companyRole === "owner" || member.companyRole === "admin"
  );

  const setMemberRole = (userId: string, projectRole: ProjectRole) =>
    onDraftChange((current) => ({
      ...current,
      memberRoles: { ...current.memberRoles, [userId]: projectRole },
    }));

  const addMember = () => {
    if (!pendingUserId) {
      return;
    }

    onDraftChange((current) => ({
      ...current,
      additions: [...current.additions, { userId: pendingUserId, projectRole: pendingRole }],
    }));
    setPendingUserId("");
    setPendingRole("viewer");
  };

  // Removing an unsaved member also drops any leadership pick that pointed at them.
  const removeAddition = (userId: string) =>
    onDraftChange((current) => ({
      ...current,
      additions: current.additions.filter((addition) => addition.userId !== userId),
      projectManagerUserId:
        current.projectManagerUserId === userId
          ? (roster.projectManagerUserId ?? "")
          : current.projectManagerUserId,
      superintendentUserId:
        current.superintendentUserId === userId
          ? (roster.superintendentUserId ?? "")
          : current.superintendentUserId,
      projectAdminUserId:
        current.projectAdminUserId === userId
          ? (roster.projectAdminUserId ?? "")
          : current.projectAdminUserId,
    }));

  const setAdditionRole = (userId: string, projectRole: ProjectRole) =>
    onDraftChange((current) => ({
      ...current,
      additions: current.additions.map((addition) =>
        addition.userId === userId ? { ...addition, projectRole } : addition
      ),
    }));

  // Saved members are marked for removal and only leave the project on save, so
  // the change can be undone first. Marking someone also clears their leadership.
  const toggleRemoval = (userId: string) =>
    onDraftChange((current) => {
      if (current.removals.includes(userId)) {
        return {
          ...current,
          removals: current.removals.filter((removal) => removal !== userId),
        };
      }

      return {
        ...current,
        removals: [...current.removals, userId],
        projectManagerUserId:
          current.projectManagerUserId === userId ? "" : current.projectManagerUserId,
        superintendentUserId:
          current.superintendentUserId === userId ? "" : current.superintendentUserId,
        projectAdminUserId:
          current.projectAdminUserId === userId ? "" : current.projectAdminUserId,
      };
    });

  return (
    <Card className="rounded-[28px] border-border/70 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Project Team</CardTitle>
        <CardDescription>
          Assign project leadership, add or remove company members, and set each member's project
          role.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!roster.hasExplicitAssignments ? (
          <Alert>
            <AlertCircle className="size-4" />
            <AlertTitle>Explicit project access starts with this save</AlertTitle>
            <AlertDescription>
              After the first assignment, lower-privilege company users will only see this project
              if they are on the team.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <LeadershipSelect
            label="Project Manager"
            value={draft.projectManagerUserId}
            options={eligibleProjectManagers}
            onChange={(value) =>
              onDraftChange((current) => ({ ...current, projectManagerUserId: value }))
            }
            hint="Company project managers on this team."
          />
          <LeadershipSelect
            label="Superintendent"
            value={draft.superintendentUserId}
            options={eligibleSuperintendents}
            onChange={(value) =>
              onDraftChange((current) => ({ ...current, superintendentUserId: value }))
            }
            hint="Field supervisors on this team."
          />
          <LeadershipSelect
            label="Project Admin"
            value={draft.projectAdminUserId}
            options={eligibleProjectAdmins}
            onChange={(value) =>
              onDraftChange((current) => ({ ...current, projectAdminUserId: value }))
            }
            hint="Company owners and admins on this team."
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Someone not listed above must be added as a team member first.
        </p>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Team Members</h3>
          {teamMembers.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
              No team members yet.
            </p>
          ) : null}
          {roster.activeMembers.map((member) => {
            const isRemoved = draft.removals.includes(member.userId);

            return (
              <TeamMemberRow
                key={member.userId}
                member={member}
                isRemoved={isRemoved}
                isProjectManager={draft.projectManagerUserId === member.userId}
                isSuperintendent={draft.superintendentUserId === member.userId}
                isProjectAdmin={draft.projectAdminUserId === member.userId}
                projectRole={draft.memberRoles[member.userId] ?? "viewer"}
                onRoleChange={(role) => setMemberRole(member.userId, role)}
                onRemove={() => toggleRemoval(member.userId)}
              />
            );
          })}
          {additions.map((member) => (
            <TeamMemberRow
              key={member.userId}
              member={member}
              isNew
              isProjectManager={draft.projectManagerUserId === member.userId}
              isSuperintendent={draft.superintendentUserId === member.userId}
              isProjectAdmin={draft.projectAdminUserId === member.userId}
              projectRole={member.projectRole}
              onRoleChange={(role) => setAdditionRole(member.userId, role)}
              onRemove={() => removeAddition(member.userId)}
            />
          ))}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Add Team Member</h3>
          {addableMembers.length > 0 ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select value={pendingUserId} onValueChange={setPendingUserId}>
                <SelectTrigger className="sm:flex-1">
                  <SelectValue placeholder="Choose a company member" />
                </SelectTrigger>
                <SelectContent>
                  {addableMembers.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      {member.fullName} · {member.companyRole.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="sm:w-48">
                <ProjectMemberRoleSelect
                  value={pendingRole}
                  onChange={(value) => setPendingRole(value as ProjectRole)}
                />
              </div>
              <Button type="button" variant="outline" disabled={!pendingUserId} onClick={addMember}>
                <Plus className="size-4" />
                Add
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Everyone in the company is already on this team.
            </p>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

function LeadershipSelect({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  options: TeamMember[];
  onChange: (value: string) => void;
  hint: string;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{label}</h3>
      <Select
        value={value === "" ? UNASSIGNED_VALUE : value}
        onValueChange={(next) => onChange(next === UNASSIGNED_VALUE ? "" : next)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Unassigned" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
          {options.map((member) => (
            <SelectItem key={member.userId} value={member.userId}>
              {member.fullName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

function TeamMemberRow({
  member,
  isNew = false,
  isRemoved = false,
  isProjectManager,
  isSuperintendent,
  isProjectAdmin,
  projectRole,
  onRoleChange,
  onRemove,
}: {
  member: TeamMember;
  isNew?: boolean;
  isRemoved?: boolean;
  isProjectManager: boolean;
  isSuperintendent: boolean;
  isProjectAdmin: boolean;
  projectRole: ProjectRole;
  onRoleChange: (role: ProjectRole) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between ${
        isRemoved ? "border-dashed opacity-60" : ""
      }`}
    >
      <div className="min-w-0">
        <p className="font-medium">{member.fullName}</p>
        <p className="text-sm text-muted-foreground">{member.email}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="secondary">{member.companyRole.replaceAll("_", " ")}</Badge>
          {isProjectManager ? <Badge>Project Manager</Badge> : null}
          {isSuperintendent ? <Badge>Superintendent</Badge> : null}
          {isProjectAdmin ? <Badge>Project Admin</Badge> : null}
          {isNew ? <Badge variant="outline">Not saved yet</Badge> : null}
          {isRemoved ? <Badge variant="destructive">Removing on save</Badge> : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 sm:w-48 sm:flex-none">
          <ProjectMemberRoleSelect
            value={projectRole}
            onChange={(value) => onRoleChange(value as ProjectRole)}
            disabled={isRemoved}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={isRemoved ? `Keep ${member.fullName}` : `Remove ${member.fullName}`}
        >
          {isRemoved ? <RotateCcw className="size-4" /> : <X className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
