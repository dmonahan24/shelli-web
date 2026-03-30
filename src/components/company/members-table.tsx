import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { appUserRoleValues } from "@/lib/auth/principal";
import { updateMemberRoleServerFn } from "@/server/company/update-member-role";

export function MemberRoleSelect({
  companyId,
  membershipId,
  value,
}: {
  companyId: string;
  membershipId: string;
  value: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={async (nextRole) => {
        const result = await updateMemberRoleServerFn({
          data: {
            companyId,
            membershipId,
            role: nextRole as (typeof appUserRoleValues)[number],
          },
        });

        if (!result.ok) {
          toast.error(result.formError ?? "Unable to update role.");
          return;
        }

        toast.success(result.message ?? "Role updated.");
      }}
    >
      <SelectTrigger className="w-[170px]">
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

export function MembersTable({
  companyId,
  rows,
}: {
  companyId: string;
  rows: Array<{
    membershipId: string;
    fullName: string;
    email: string;
    role: string;
    status: string;
    joinedAt: Date | null;
    assignedProjectsCount: number;
  }>;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Company Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Assigned Projects</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.membershipId}>
              <TableCell className="font-medium">{row.fullName}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>
                <MemberRoleSelect companyId={companyId} membershipId={row.membershipId} value={row.role} />
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{row.status}</Badge>
              </TableCell>
              <TableCell>{row.joinedAt ? new Date(row.joinedAt).toLocaleDateString() : "Pending"}</TableCell>
              <TableCell>{row.assignedProjectsCount}</TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm">
                  View Assignments
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
