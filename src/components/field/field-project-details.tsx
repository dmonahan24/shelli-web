import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FieldProjectSummaryCard({
  estimatedTotalConcrete,
  totalConcretePoured,
  remainingConcrete,
}: {
  estimatedTotalConcrete: number;
  totalConcretePoured: number;
  remainingConcrete: number;
}) {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-base">Today Summary</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Estimated</p>
          <p className="text-lg font-semibold">{estimatedTotalConcrete.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Poured</p>
          <p className="text-lg font-semibold">{totalConcretePoured.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Remaining</p>
          <p className="text-lg font-semibold">{remainingConcrete.toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function FieldRecentPoursList({
  rows,
}: {
  rows: Array<{ id: string; scheduledDate: string; placementAreaLabel: string; actualVolume: number }>;
}) {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-base">Recent Pours</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent pours yet.</p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="rounded-xl border border-border/60 px-3 py-3">
              <p className="font-medium">{row.placementAreaLabel}</p>
              <p className="text-sm text-muted-foreground">
                {row.scheduledDate} • {row.actualVolume.toLocaleString()} yds
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function FieldRecentUploadsList({
  rows,
}: {
  rows: Array<{ id: string; originalFileName: string; attachmentType: string; createdAt: Date }>;
}) {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-base">Recent Uploads</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent uploads yet.</p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="rounded-xl border border-border/60 px-3 py-3">
              <p className="font-medium">{row.originalFileName}</p>
              <p className="text-sm text-muted-foreground">
                {row.attachmentType.replaceAll("_", " ")} • {new Date(row.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
