import { Badge } from "@/components/ui/badge";
import { type AccessRequestStatus } from "@/lib/auth/principal";

const variantByStatus = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
} as const;

export function AccessRequestStatusBadge({
  status,
}: {
  status: AccessRequestStatus;
}) {
  return (
    <Badge variant={variantByStatus[status]} className="capitalize">
      {status.replaceAll("_", " ")}
    </Badge>
  );
}
