import { Users } from "lucide-react";
import { AssignProjectMemberDialog } from "@/components/company/assign-project-member-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProjectAccessRoster = {
  projectId: string;
  projectName: string;
  hasExplicitAssignments: boolean;
  projectManagerUserId: string | null;
  superintendentUserId: string | null;
  activeMembers: Array<{
    userId: string;
    fullName: string;
    email: string;
    companyRole: string;
    projectRole: string;
    isProjectManager: boolean;
    isSuperintendent: boolean;
  }>;
  pendingInvitees: Array<{
    invitationId: string;
    email: string;
    companyRole: string;
    projectRole: string;
    expiresAt: Date;
    invitedByName: string;
  }>;
  availableMembers: Array<{
    userId: string;
    fullName: string;
    email: string;
    companyRole: string;
  }>;
};

export function RemoveProjectMemberDialog() {
  return null;
}

export function ProjectMembersCard({
  projectId,
  projectName,
  roster,
  onMutationComplete,
}: {
  projectId: string;
  projectName: string;
  roster: ProjectAccessRoster;
  onMutationComplete?: () => void;
}) {
  return (
    <Card className="border-border/70">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base">Project Access</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Active team members and pending invites for this project.
          </p>
        </div>
        <AssignProjectMemberDialog
          projectId={projectId}
          projectName={projectName}
          activeMembers={roster.activeMembers}
          pendingInvitees={roster.pendingInvitees}
          availableMembers={roster.availableMembers}
          hasExplicitAssignments={roster.hasExplicitAssignments}
          currentProjectManagerUserId={roster.projectManagerUserId}
          currentSuperintendentUserId={roster.superintendentUserId}
          onComplete={onMutationComplete}
        />
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Active Members</p>
                <p className="text-sm text-muted-foreground">
                  {roster.activeMembers.length} currently assigned
                </p>
              </div>
              <Badge variant="secondary">{roster.activeMembers.length}</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {roster.activeMembers.length > 0 ? (
                roster.activeMembers.map((member) => (
                  <div key={member.userId} className="rounded-xl border border-border/60 px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{member.fullName}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                      <Badge variant="outline">{member.projectRole.replaceAll("_", " ")}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary">{member.companyRole.replaceAll("_", " ")}</Badge>
                      {member.isProjectManager ? <Badge>Project Manager</Badge> : null}
                      {member.isSuperintendent ? <Badge>Superintendent</Badge> : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                  No explicit project members yet.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Pending Invites</p>
                <p className="text-sm text-muted-foreground">
                  {roster.pendingInvitees.length} waiting for acceptance
                </p>
              </div>
              <Badge variant="secondary">{roster.pendingInvitees.length}</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {roster.pendingInvitees.length > 0 ? (
                roster.pendingInvitees.map((invite) => (
                  <div key={invite.invitationId} className="rounded-xl border border-border/60 px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{invite.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Invited by {invite.invitedByName}
                        </p>
                      </div>
                      <Badge variant="outline">{invite.projectRole.replaceAll("_", " ")}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary">{invite.companyRole.replaceAll("_", " ")}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                  No queued project invites yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {roster.activeMembers.length === 0 && roster.pendingInvitees.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Users className="size-4" />
              Start staffing this project
            </div>
            <p className="mt-2">
              Add existing team members or invite new people and queue their project access before
              they join the company workspace.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
