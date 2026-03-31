import * as React from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/auth/submit-button";
import { DeletePourEventDialog } from "@/components/pours/delete-pour-event-dialog";
import { PourEventDetailSheet } from "@/components/pours/pour-event-detail-sheet";
import { PourEventFilters, PourEventsPagination } from "@/components/pours/pour-event-filters";
import { PourEventForm } from "@/components/pours/pour-event-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MobileActionRow,
  MobileCard,
  MobileCardHeader,
  MobileCardList,
  MobileMetric,
  MobileMetricGrid,
  ResponsiveTableLayout,
} from "@/components/ui/responsive-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatConcreteVolume, formatDate } from "@/lib/utils/format";
import { updatePourEventServerFn } from "@/server/pours/update-pour-event";
import { listProjectPoursServerFn } from "@/server/pours/list-pour-events";

type PoursResponse = Awaited<ReturnType<typeof listProjectPoursServerFn>>;
type PourRow = PoursResponse["rows"][number];

export function PourEventsTable({
  initialData,
  onMutationComplete,
  onOpenCreate,
  projectId,
}: {
  initialData: PoursResponse;
  onMutationComplete: () => Promise<void> | void;
  onOpenCreate: () => void;
  projectId: string;
}) {
  const [data, setData] = React.useState(initialData);
  const [query, setQuery] = React.useState({
    q: "",
    page: initialData.page,
    pageSize: initialData.pageSize,
    sortBy: "pourDate",
    sortDir: "desc",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: "",
  });
  const [selectedPour, setSelectedPour] = React.useState<PourRow | null>(null);
  const [editingPour, setEditingPour] = React.useState<PourRow | null>(null);
  const [isRefreshing, startRefreshTransition] = React.useTransition();

  const refresh = React.useCallback(async () => {
    const response = await listProjectPoursServerFn({
      data: {
        projectId,
        query: {
          ...query,
          dateFrom: query.dateFrom || undefined,
          dateTo: query.dateTo || undefined,
          maxAmount: query.maxAmount ? Number(query.maxAmount) : undefined,
          minAmount: query.minAmount ? Number(query.minAmount) : undefined,
          q: query.q || undefined,
        },
      },
    });

    setData(response);
  }, [projectId, query]);

  React.useEffect(() => {
    startRefreshTransition(() => {
      void refresh();
    });
  }, [refresh]);

  return (
    <>
      <Card className="rounded-[28px] border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="gap-4">
          <div className="tablet-stack">
            <div className="min-w-0">
              <CardTitle>Concrete Pour Event Log</CardTitle>
              <p className="text-sm text-muted-foreground">
                Track delivered volume, location, supplier, and notes for the project’s operational
                history.
              </p>
            </div>
            <Button onClick={onOpenCreate}>
              <Plus className="mr-2 size-4" />
              Add Pour Event
            </Button>
          </div>
          <PourEventFilters
            query={{
              ...query,
              maxAmount: query.maxAmount ? Number(query.maxAmount) : undefined,
              minAmount: query.minAmount ? Number(query.minAmount) : undefined,
            }}
            onSearchChange={(value) => setQuery((current) => ({ ...current, page: 1, q: value }))}
            onSortByChange={(value) => setQuery((current) => ({ ...current, page: 1, sortBy: value }))}
            onSortDirChange={(value) => setQuery((current) => ({ ...current, page: 1, sortDir: value }))}
            onPageSizeChange={(value) =>
              setQuery((current) => ({ ...current, page: 1, pageSize: Number(value) }))
            }
            onDateChange={(field, value) =>
              setQuery((current) => ({ ...current, page: 1, [field]: value }))
            }
            onAmountChange={(field, value) =>
              setQuery((current) => ({ ...current, page: 1, [field]: value }))
            }
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <ResponsiveTableLayout
            desktop={
              <div className="desktop-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Pour Date</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Concrete Amount</TableHead>
                      <TableHead className="whitespace-nowrap">Unit</TableHead>
                      <TableHead>Location Description</TableHead>
                      <TableHead>Mix Type</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead className="whitespace-nowrap">Ticket Number</TableHead>
                      <TableHead>Notes Summary</TableHead>
                      <TableHead className="whitespace-nowrap">Created By</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.length > 0 ? (
                      data.rows.map((pourEvent) => (
                        <TableRow key={pourEvent.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(pourEvent.pourDate)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right">
                            {formatConcreteVolume(pourEvent.concreteAmount)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {pourEvent.unit.replaceAll("_", " ")}
                          </TableCell>
                          <TableCell>{pourEvent.locationDescription}</TableCell>
                          <TableCell>{pourEvent.mixType ?? "Not recorded"}</TableCell>
                          <TableCell>{pourEvent.supplierName ?? "Not recorded"}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {pourEvent.ticketNumber ?? "Not recorded"}
                          </TableCell>
                          <TableCell className="max-w-52 truncate text-muted-foreground">
                            {pourEvent.crewNotes ?? pourEvent.weatherNotes ?? "No notes"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{pourEvent.createdBy}</TableCell>
                          <TableCell className="whitespace-nowrap text-right">
                            <PourEventRowActions
                              onDelete={async () => {
                                await refresh();
                                await onMutationComplete();
                              }}
                              onEdit={() => setEditingPour(pourEvent)}
                              onView={() => setSelectedPour(pourEvent)}
                              pourEvent={pourEvent}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                          {isRefreshing
                            ? "Loading pour events..."
                            : "No pour events found for this project yet."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            }
            mobile={
              <MobileCardList>
                {data.rows.length > 0 ? (
                  data.rows.map((pourEvent) => (
                    <MobileCard key={pourEvent.id}>
                      <MobileCardHeader
                        title={formatDate(pourEvent.pourDate)}
                        subtitle={pourEvent.locationDescription}
                      />
                      <MobileMetricGrid>
                        <MobileMetric
                          label="Amount"
                          value={formatConcreteVolume(pourEvent.concreteAmount)}
                        />
                        <MobileMetric label="Unit" value={pourEvent.unit.replaceAll("_", " ")} />
                        <MobileMetric
                          label="Mix"
                          value={pourEvent.mixType ?? "Not recorded"}
                        />
                        <MobileMetric
                          label="Supplier"
                          value={pourEvent.supplierName ?? "Not recorded"}
                        />
                        <MobileMetric
                          label="Ticket"
                          value={pourEvent.ticketNumber ?? "Not recorded"}
                        />
                        <MobileMetric label="Created By" value={pourEvent.createdBy} />
                      </MobileMetricGrid>
                      <MobileMetric
                        label="Notes"
                        value={pourEvent.crewNotes ?? pourEvent.weatherNotes ?? "No notes"}
                      />
                      <MobileActionRow className="[&>*]:flex-1">
                        <Button variant="outline" onClick={() => setSelectedPour(pourEvent)}>
                          View
                        </Button>
                        <PourEventRowActions
                          onDelete={async () => {
                            await refresh();
                            await onMutationComplete();
                          }}
                          onEdit={() => setEditingPour(pourEvent)}
                          onView={() => setSelectedPour(pourEvent)}
                          pourEvent={pourEvent}
                        />
                      </MobileActionRow>
                    </MobileCard>
                  ))
                ) : (
                  <MobileCard>
                    <p className="text-sm text-muted-foreground">
                      {isRefreshing
                        ? "Loading pour events..."
                        : "No pour events found for this project yet."}
                    </p>
                  </MobileCard>
                )}
              </MobileCardList>
            }
          />
          <PourEventsPagination
            page={data.page}
            pageCount={data.pageCount}
            onPrevious={() => setQuery((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}
            onNext={() =>
              setQuery((current) => ({ ...current, page: Math.min(data.pageCount, current.page + 1) }))
            }
          />
        </CardContent>
      </Card>
      <PourEventDetailSheet
        open={Boolean(selectedPour)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPour(null);
          }
        }}
        pourEvent={selectedPour}
      />
      <EditPourEventDialog
        open={Boolean(editingPour)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingPour(null);
          }
        }}
        onUpdated={async () => {
          await refresh();
          await onMutationComplete();
        }}
        pourEvent={editingPour}
      />
    </>
  );
}

export function PourEventRowActions({
  onDelete,
  onEdit,
  onView,
  pourEvent,
}: {
  onDelete: () => Promise<void> | void;
  onEdit: () => void;
  onView: () => void;
  pourEvent: PourRow;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onView}>View</DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
        <DeletePourEventDialog
          onDeleted={onDelete}
          pourEvent={pourEvent}
          trigger={<DropdownMenuItem onSelect={(event) => event.preventDefault()}>Delete</DropdownMenuItem>}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function EditPourEventDialog({
  onOpenChange,
  onUpdated,
  open,
  pourEvent,
}: {
  onOpenChange: (open: boolean) => void;
  onUpdated: () => Promise<void> | void;
  open: boolean;
  pourEvent: PourRow | null;
}) {
  const [isPending, startTransition] = React.useTransition();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Pour Event</DialogTitle>
        </DialogHeader>
        {pourEvent ? (
          <PourEventForm
            defaultValues={{
              projectId: pourEvent.projectId,
              pourDate: pourEvent.pourDate,
              concreteAmount: pourEvent.concreteAmount,
              unit: "cubic_yards",
              locationDescription: pourEvent.locationDescription,
              mixType: pourEvent.mixType ?? "",
              supplierName: pourEvent.supplierName ?? "",
              ticketNumber: pourEvent.ticketNumber ?? "",
              weatherNotes: pourEvent.weatherNotes ?? "",
              crewNotes: pourEvent.crewNotes ?? "",
            }}
            onSubmit={(values, setFieldError) =>
              startTransition(async () => {
                const result = await updatePourEventServerFn({
                  data: {
                    ...values,
                    id: pourEvent.id,
                  },
                });

                if (!result.ok) {
                  for (const [fieldName, message] of Object.entries(
                    (result.fieldErrors ?? {}) as Record<string, string>
                  )) {
                    setFieldError(fieldName as keyof typeof values, message);
                  }

                  if (!result.fieldErrors) {
                    toast.error(result.formError ?? "Unable to update pour event.");
                  }

                  return;
                }

                toast.success(result.message ?? "Pour event updated.");
                onOpenChange(false);
                await onUpdated();
              })
            }
            submitButton={
              <SubmitButton pending={isPending} className="w-full sm:w-auto">
                Save Pour Event
              </SubmitButton>
            }
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
