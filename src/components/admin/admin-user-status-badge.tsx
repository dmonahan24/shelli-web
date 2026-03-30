import { Badge } from "@/components/ui/badge";
import { type AdminUserStatus } from "@/lib/auth/principal";

const variantByStatus = {
  unassigned_auth_user: "secondary",
  pending_access: "secondary",
  tenant_active: "default",
  tenant_inactive: "destructive",
  platform_admin: "default",
} as const;

const labelByStatus = {
  unassigned_auth_user: "Not assigned",
  pending_access: "Pending access",
  tenant_active: "Tenant active",
  tenant_inactive: "Tenant inactive",
  platform_admin: "Platform admin",
} as const;

export function AdminUserStatusBadge({
  status,
}: {
  status: AdminUserStatus;
}) {
  return <Badge variant={variantByStatus[status]}>{labelByStatus[status]}</Badge>;
}
