import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatConcreteVolume } from "@/lib/utils/format";

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-[24px] border-border/70 bg-card/90 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

export function FloorSummaryCards({
  actualConcreteTotal,
  completedPourTypesCount,
  estimatedConcreteTotal,
  remainingConcrete,
  totalPourTypes,
}: {
  actualConcreteTotal: number;
  completedPourTypesCount: number;
  estimatedConcreteTotal: number;
  remainingConcrete: number;
  totalPourTypes: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <SummaryCard label="Estimated Concrete" value={formatConcreteVolume(estimatedConcreteTotal)} />
      <SummaryCard label="Actual Concrete" value={formatConcreteVolume(actualConcreteTotal)} />
      <SummaryCard label="Remaining Concrete" value={formatConcreteVolume(remainingConcrete)} />
      <SummaryCard label="Total Pours" value={String(totalPourTypes)} />
      <SummaryCard label="Completed Pours" value={String(completedPourTypesCount)} />
    </div>
  );
}
