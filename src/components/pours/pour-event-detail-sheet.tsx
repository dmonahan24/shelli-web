import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatConcreteVolume, formatDate, formatDateTime } from "@/lib/utils/format";

export function PourEventDetailSheet({
  onOpenChange,
  open,
  pourEvent,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  pourEvent:
    | {
        concreteAmount: number;
        createdAt: Date;
        createdBy: string;
        crewNotes: string | null;
        locationDescription: string;
        mixType: string | null;
        pourDate: string;
        supplierName: string | null;
        ticketNumber: string | null;
        unit: string;
        updatedAt: Date;
        weatherNotes: string | null;
      }
    | null;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        {pourEvent ? (
          <>
            <SheetHeader>
              <SheetTitle>{pourEvent.locationDescription}</SheetTitle>
              <SheetDescription>
                {formatDate(pourEvent.pourDate)} • {formatConcreteVolume(pourEvent.concreteAmount)}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-5 p-4 text-sm">
              <DetailRow label="Mix Type" value={pourEvent.mixType ?? "Not recorded"} />
              <DetailRow label="Supplier" value={pourEvent.supplierName ?? "Not recorded"} />
              <DetailRow label="Ticket Number" value={pourEvent.ticketNumber ?? "Not recorded"} />
              <DetailRow label="Weather Notes" value={pourEvent.weatherNotes ?? "None"} />
              <DetailRow label="Crew Notes" value={pourEvent.crewNotes ?? "None"} />
              <DetailRow label="Created By" value={pourEvent.createdBy} />
              <DetailRow label="Created At" value={formatDateTime(pourEvent.createdAt)} />
              <DetailRow label="Last Updated" value={formatDateTime(pourEvent.updatedAt)} />
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="text-foreground">{value}</p>
    </div>
  );
}
