import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <div className="rounded-2xl border border-border/70 bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Invited By</TableHead>
            <TableHead>Sent</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
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
                <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(row.expiresAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{status}</Badge>
                </TableCell>
                <TableCell className="flex justify-end gap-2">
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
