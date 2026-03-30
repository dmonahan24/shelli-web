import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { formatConcreteVolume, formatDate } from "@/lib/utils/format";

export function ProjectInfoCard({
  project,
}: {
  project: {
    address: string;
    dateStarted: string;
    description: string | null;
    estimatedCompletionDate: string;
    estimatedTotalConcrete: number;
    projectCode: string | null;
    status: string;
    totalConcretePoured: number;
  };
}) {
  return (
    <Card className="rounded-[24px] border-border/70 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Project Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <InfoRow label="Status" value={<ProjectStatusBadge status={project.status} />} />
        <InfoRow label="Address" value={project.address} />
        <InfoRow label="Date Started" value={formatDate(project.dateStarted)} />
        <InfoRow
          label="Estimated Completion"
          value={formatDate(project.estimatedCompletionDate)}
        />
        <InfoRow
          label="Estimated Total"
          value={formatConcreteVolume(project.estimatedTotalConcrete)}
        />
        <InfoRow
          label="Total Poured"
          value={formatConcreteVolume(project.totalConcretePoured)}
        />
        {project.projectCode ? <InfoRow label="Project Code" value={project.projectCode} /> : null}
        {project.description ? <InfoRow label="Description" value={project.description} /> : null}
      </CardContent>
    </Card>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
        {label}
      </p>
      <div className="text-foreground">{value}</div>
    </div>
  );
}
