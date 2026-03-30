import { AlertTriangle, Camera, ReceiptText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function MissingPhotoWarning({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
      <Camera className="mt-0.5 size-4" />
      <span>{message}</span>
    </div>
  );
}

export function MissingTicketWarning({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-3 py-3 text-sm text-orange-950">
      <ReceiptText className="mt-0.5 size-4" />
      <span>{message}</span>
    </div>
  );
}

export function DocumentationTaskCard({
  title,
  description,
  severity,
}: {
  title: string;
  description: string;
  severity: "warning" | "critical";
}) {
  return (
    <Card className={severity === "critical" ? "border-red-200 bg-red-50/60" : "border-amber-200 bg-amber-50/60"}>
      <CardContent className="flex items-start gap-3 p-4">
        <AlertTriangle className="mt-0.5 size-5" />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
