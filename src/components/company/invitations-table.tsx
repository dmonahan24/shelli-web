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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { resendInvitationServerFn, revokeInvitationServerFn } from "@/server/company/invite-member";

export function RevokeInvitationDialog({
  companyId,
  invitationId,
}: {
  companyId: string;
  invitationId: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        const result = await revokeInvitationServerFn({
          data: {
            companyId,
            invitationId,
          },
        });

        if (!result.ok) {
          toast.error(result.formError ?? "Unable to revoke invitation.");
          return;
        }

        toast.success(result.message ?? "Invitation revoked.");
      }}
    >
      Revoke
    </Button>
  );
}

export function InvitationsTable({
  companyId,
  rows,
}: {
  companyId: string;
  rows: Array<{
    id: string;
    email: string;
    role: string;
    invitedByName: string;
    createdAt: Date;
    expiresAt: Date;
    acceptedAt: Date | null;
    revokedAt: Date | null;
  }>;
}) {
  return (
    <ResponsiveTableLayout
      desktop={
        <div className="rounded-2xl border border-border/70 bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Invited By</TableHead>
                <TableHead className="whitespace-nowrap">Sent</TableHead>
                <TableHead className="whitespace-nowrap">Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const status = row.acceptedAt ? "accepted" : row.revokedAt ? "revoked" : "pending";

                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.email}</TableCell>
                    <TableCell>{row.role.replaceAll("_", " ")}</TableCell>
                    <TableCell>{row.invitedByName}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(row.expiresAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{status}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const result = await resendInvitationServerFn({
                              data: { companyId, invitationId: row.id },
                            });

                            if (!result.ok) {
                              toast.error(result.formError ?? "Unable to resend invitation.");
                              return;
                            }

                            toast.success(result.message ?? "Invitation resent.");
                          }}
                        >
                          Resend
                        </Button>
                        <RevokeInvitationDialog companyId={companyId} invitationId={row.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      }
      mobile={
        <MobileCardList>
          {rows.map((row) => {
            const status = row.acceptedAt ? "accepted" : row.revokedAt ? "revoked" : "pending";

            return (
              <MobileCard key={row.id}>
                <MobileCardHeader
                  title={row.email}
                  subtitle={`Invited by ${row.invitedByName}`}
                  badge={<Badge variant="secondary">{status}</Badge>}
                />
                <MobileMetricGrid>
                  <MobileMetric label="Role" value={row.role.replaceAll("_", " ")} />
                  <MobileMetric label="Sent" value={new Date(row.createdAt).toLocaleDateString()} />
                  <MobileMetric
                    label="Expires"
                    value={new Date(row.expiresAt).toLocaleDateString()}
                  />
                </MobileMetricGrid>
                <MobileActionRow className="[&>*]:flex-1">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const result = await resendInvitationServerFn({
                        data: { companyId, invitationId: row.id },
                      });

                      if (!result.ok) {
                        toast.error(result.formError ?? "Unable to resend invitation.");
                        return;
                      }

                      toast.success(result.message ?? "Invitation resent.");
                    }}
                  >
                    Resend
                  </Button>
                  <RevokeInvitationDialog companyId={companyId} invitationId={row.id} />
                </MobileActionRow>
              </MobileCard>
            );
          })}
        </MobileCardList>
      }
    />
  );
}
