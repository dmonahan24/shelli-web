import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function FieldProjectHeader({
  name,
  status,
}: {
  name: string;
  status: string;
}) {
  return (
    <Card className="sticky top-16 z-10 border-border/70 bg-background/95 backdrop-blur">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">Project</p>
          <h1 className="text-xl font-semibold">{name}</h1>
        </div>
        <Badge variant="secondary">{status.replaceAll("_", " ")}</Badge>
      </CardContent>
    </Card>
  );
}
