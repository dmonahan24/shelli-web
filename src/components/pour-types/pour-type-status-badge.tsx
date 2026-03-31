import { Badge } from "@/components/ui/badge";
import { getPourTypeStatusLabel } from "@/lib/hierarchy";

export function PourTypeStatusBadge({
  status,
}: {
  status: "not_started" | "in_progress" | "completed";
}) {
  const variant = status === "completed" ? "default" : status === "in_progress" ? "secondary" : "outline";

  return <Badge variant={variant}>{getPourTypeStatusLabel(status)}</Badge>;
}
