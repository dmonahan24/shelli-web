import { DeletePourTypeDialog } from "@/components/pour-types/delete-pour-type-dialog";
import { EditPourTypeDialog } from "@/components/pour-types/edit-pour-type-dialog";
import { PourTypeStatusBadge } from "@/components/pour-types/pour-type-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getPourCategoryLabel } from "@/lib/hierarchy";
import { formatConcreteVolume, formatDateTime } from "@/lib/utils/format";

type PourTypeRow = {
  actualConcrete: number;
  displayOrder: number;
  estimatedConcrete: number;
  id: string;
  name: string;
  notes: string | null;
  pourCategory: "footings" | "grade_beams" | "slab" | "columns" | "shear_walls" | "core_walls" | "stairs" | "elevator_pit" | "deck" | "other";
  remainingConcrete: number;
  status: "not_started" | "in_progress" | "completed";
  updatedAt: Date;
};

export function PourTypesTable({
  onMutationComplete,
  pourTypes,
}: {
  onMutationComplete: () => Promise<void> | void;
  pourTypes: PourTypeRow[];
}) {
  return (
    <Card className="rounded-[28px] border-border/80 bg-card/90 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Floor Pour Items</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveTableLayout
          desktop={
            <div className="desktop-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Estimated</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Actual</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Remaining</TableHead>
                    <TableHead className="whitespace-nowrap">Updated</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pourTypes.length > 0 ? (
                    pourTypes.map((pourType) => (
                      <TableRow key={pourType.id}>
                        <TableCell className="font-medium">{pourType.name}</TableCell>
                        <TableCell>{getPourCategoryLabel(pourType.pourCategory)}</TableCell>
                        <TableCell>
                          <PourTypeStatusBadge status={pourType.status} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          {formatConcreteVolume(pourType.estimatedConcrete)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          {formatConcreteVolume(pourType.actualConcrete)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          {formatConcreteVolume(pourType.remainingConcrete)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatDateTime(pourType.updatedAt)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            <EditPourTypeDialog
                              onUpdated={onMutationComplete}
                              pourType={pourType}
                              trigger={
                                <Button size="sm" variant="outline">
                                  Edit
                                </Button>
                              }
                            />
                            <DeletePourTypeDialog
                              onDeleted={onMutationComplete}
                              pourType={pourType}
                              trigger={
                                <Button size="sm" variant="destructive">
                                  Delete
                                </Button>
                              }
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell className="h-24 text-center" colSpan={8}>
                        No floor pour items yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          }
          mobile={
            <MobileCardList>
              {pourTypes.length > 0 ? (
                pourTypes.map((pourType) => (
                  <MobileCard key={pourType.id}>
                    <MobileCardHeader
                      title={pourType.name}
                      subtitle={getPourCategoryLabel(pourType.pourCategory)}
                      badge={<PourTypeStatusBadge status={pourType.status} />}
                    />
                    <MobileMetricGrid>
                      <MobileMetric
                        label="Estimated"
                        value={formatConcreteVolume(pourType.estimatedConcrete)}
                      />
                      <MobileMetric
                        label="Actual"
                        value={formatConcreteVolume(pourType.actualConcrete)}
                      />
                      <MobileMetric
                        label="Remaining"
                        value={formatConcreteVolume(pourType.remainingConcrete)}
                      />
                      <MobileMetric label="Updated" value={formatDateTime(pourType.updatedAt)} />
                    </MobileMetricGrid>
                    <MobileActionRow className="[&>*]:flex-1">
                      <EditPourTypeDialog
                        onUpdated={onMutationComplete}
                        pourType={pourType}
                        trigger={<Button variant="outline">Edit</Button>}
                      />
                      <DeletePourTypeDialog
                        onDeleted={onMutationComplete}
                        pourType={pourType}
                        trigger={<Button variant="destructive">Delete</Button>}
                      />
                    </MobileActionRow>
                  </MobileCard>
                ))
              ) : (
                <MobileCard>
                  <p className="text-sm text-muted-foreground">No floor pour items yet.</p>
                </MobileCard>
              )}
            </MobileCardList>
          }
        />
      </CardContent>
    </Card>
  );
}
