import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignProjectMemberDialog } from "@/components/company/assign-project-member-dialog";

export function RemoveProjectMemberDialog() {
  return null;
}

export function ProjectMembersCard({
  projectId,
  members,
  companyMembers,
}: {
  projectId: string;
  members: Array<{ id: string; fullName: string; email: string; role: string }>;
  companyMembers: Array<{ userId: string; label: string }>;
}) {
  return (
    <Card className="border-border/70">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Project Access</CardTitle>
        <AssignProjectMemberDialog projectId={projectId} members={companyMembers} />
      </CardHeader>
      <CardContent className="space-y-3">
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No project-specific assignments yet.</p>
        ) : (
          members.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-3">
              <div>
                <p className="font-medium">{member.fullName}</p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
              <Badge variant="secondary">{member.role.replaceAll("_", " ")}</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
