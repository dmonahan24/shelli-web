import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RemainingConcreteBadge } from "@/components/projects/remaining-concrete-badge";
import { formatConcreteVolume, formatDate } from "@/lib/utils/format";

function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: ReactNode;
}) {
  return (
    <Card className="rounded-[24px] border-border/70 bg-card/90 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xl font-semibold tracking-tight">{value}</p>
        {helper}
      </CardContent>
    </Card>
  );
}

export function ProjectSummaryCards({
  project,
  totalAttachments,
}: {
  project: {
    address: string;
    dateStarted: string;
    estimatedCompletionDate: string;
    estimatedTotalConcrete: number;
    lastPourDate: string | null;
    totalConcretePoured: number;
  };
  totalAttachments: number;
}) {
  const remainingConcrete = project.estimatedTotalConcrete - project.totalConcretePoured;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard label="Project Address" value={project.address} />
      <SummaryCard label="Date Started" value={formatDate(project.dateStarted)} />
      <SummaryCard
        label="Estimated Completion Date"
        value={formatDate(project.estimatedCompletionDate)}
      />
      <SummaryCard
        label="Total Concrete Poured"
        value={formatConcreteVolume(project.totalConcretePoured)}
      />
      <SummaryCard
        label="Estimated Total Concrete"
        value={formatConcreteVolume(project.estimatedTotalConcrete)}
      />
      <SummaryCard
        label="Remaining Concrete"
        value={formatConcreteVolume(Math.max(remainingConcrete, 0))}
        helper={
          <RemainingConcreteBadge
            estimatedTotalConcrete={project.estimatedTotalConcrete}
            totalConcretePoured={project.totalConcretePoured}
          />
        }
      />
      <SummaryCard
        label="Last Pour Date"
        value={project.lastPourDate ? formatDate(project.lastPourDate) : "No pours yet"}
      />
      <SummaryCard label="Total Attachments" value={String(totalAttachments)} />
    </div>
  );
}
