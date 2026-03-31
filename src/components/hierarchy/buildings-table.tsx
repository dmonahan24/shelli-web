import { Link } from "@tanstack/react-router";
import { EditBuildingDialog } from "@/components/buildings/edit-building-dialog";
import { DeleteBuildingDialog } from "@/components/buildings/delete-building-dialog";
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
import { formatConcreteVolume } from "@/lib/utils/format";

type BuildingRow = {
  actualConcreteTotal: number;
  code: string | null;
  description: string | null;
  displayOrder: number;
  estimatedConcreteTotal: number;
  floorCount: number;
  id: string;
  name: string;
  pourTypeCount: number;
  projectId: string;
  remainingConcrete: number;
};

export function BuildingsTable({
  buildings,
  onMutationComplete,
  projectId,
}: {
  buildings: BuildingRow[];
  onMutationComplete: () => Promise<void> | void;
  projectId: string;
}) {
  return (
    <Card className="rounded-[28px] border-border/80 bg-card/90 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Buildings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-2xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Building</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="text-right">Floors</TableHead>
                <TableHead className="text-right">Estimated</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buildings.length > 0 ? (
                buildings.map((building) => (
                  <TableRow key={building.id}>
                    <TableCell className="font-medium">
                      <Link
                        className="hover:underline"
                        to="/dashboard/projects/$projectId/buildings/$buildingId"
                        params={{ buildingId: building.id, projectId }}
                      >
                        {building.name}
                      </Link>
                    </TableCell>
                    <TableCell>{building.code ?? "—"}</TableCell>
                    <TableCell className="text-right">{building.floorCount}</TableCell>
                    <TableCell className="text-right">
                      {formatConcreteVolume(building.estimatedConcreteTotal)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatConcreteVolume(building.actualConcreteTotal)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatConcreteVolume(building.remainingConcrete)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link
                            to="/dashboard/projects/$projectId/buildings/$buildingId"
                            params={{ buildingId: building.id, projectId }}
                          >
                            View
                          </Link>
                        </Button>
                        <EditBuildingDialog
                          building={building}
                          onUpdated={onMutationComplete}
                          trigger={
                            <Button size="sm" variant="outline">
                              Edit
                            </Button>
                          }
                        />
                        <DeleteBuildingDialog
                          building={building}
                          onDeleted={onMutationComplete}
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
                  <TableCell className="h-24 text-center" colSpan={7}>
                    No buildings yet.
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
