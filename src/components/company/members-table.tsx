import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MobileActionRow,
  MobileCard,
  MobileCardHeader,
  MobileCardList,
  MobileMetric,
  MobileMetricGrid,
  ResponsiveTableLayout,
} from "@/components/ui/responsive-layout";
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
      <SelectTrigger className="w-full min-w-0 lg:w-[170px]">
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
    <ResponsiveTableLayout
      desktop={
        <div className="rounded-2xl border border-border/70 bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="whitespace-nowrap">Joined</TableHead>
                <TableHead className="whitespace-nowrap text-right">Assigned Projects</TableHead>
                <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.membershipId}>
                  <TableCell className="font-medium whitespace-nowrap">{row.fullName}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>
                    <MemberRoleSelect
                      companyId={companyId}
                      membershipId={row.membershipId}
                      value={row.role}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.status}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {row.joinedAt ? new Date(row.joinedAt).toLocaleDateString() : "Pending"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    {row.assignedProjectsCount}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <Button variant="outline" size="sm">
                      View Assignments
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      }
      mobile={
        <MobileCardList>
          {rows.map((row) => (
            <MobileCard key={row.membershipId}>
              <MobileCardHeader
                title={row.fullName}
                subtitle={row.email}
                badge={<Badge variant="secondary">{row.status}</Badge>}
              />
              <MobileMetricGrid>
                <MobileMetric
                  label="Joined"
                  value={row.joinedAt ? new Date(row.joinedAt).toLocaleDateString() : "Pending"}
                />
                <MobileMetric label="Projects" value={row.assignedProjectsCount} />
              </MobileMetricGrid>
              <div className="space-y-2">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  Company Role
                </p>
                <MemberRoleSelect
                  companyId={companyId}
                  membershipId={row.membershipId}
                  value={row.role}
                />
              </div>
              <MobileActionRow>
                <Button variant="outline" className="flex-1">
                  View Assignments
                </Button>
              </MobileActionRow>
            </MobileCard>
          ))}
        </MobileCardList>
      }
    />
  );
}
