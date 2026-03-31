import { DeletePourTypeDialog } from "@/components/pour-types/delete-pour-type-dialog";
import { EditPourTypeDialog } from "@/components/pour-types/edit-pour-type-dialog";
import { PourTypeStatusBadge } from "@/components/pour-types/pour-type-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <div className="overflow-hidden rounded-2xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Estimated</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="text-right">
                      {formatConcreteVolume(pourType.estimatedConcrete)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatConcreteVolume(pourType.actualConcrete)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatConcreteVolume(pourType.remainingConcrete)}
                    </TableCell>
                    <TableCell>{formatDateTime(pourType.updatedAt)}</TableCell>
                    <TableCell>
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
      </CardContent>
    </Card>
  );
}
