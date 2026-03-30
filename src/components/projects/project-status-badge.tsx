import { Badge } from "@/components/ui/badge";

const statusLabelMap = {
  active: "Active",
  completed: "Completed",
  on_hold: "On Hold",
} as const;

const statusClassMap = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  completed: "border-slate-200 bg-slate-100 text-slate-700",
  on_hold: "border-amber-200 bg-amber-50 text-amber-700",
} as const;

export function ProjectStatusBadge({
  status,
}: {
  status: string;
}) {
  const normalizedStatus = (status in statusLabelMap ? status : "active") as keyof typeof statusLabelMap;

  return (
    <Badge variant="outline" className={statusClassMap[normalizedStatus]}>
      {statusLabelMap[normalizedStatus]}
    </Badge>
  );
}
