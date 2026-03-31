import { DeleteFloorDialog } from "@/components/floors/delete-floor-dialog";
import { EditFloorDialog } from "@/components/floors/edit-floor-dialog";
import { PendingLink } from "@/components/navigation/pending-link";
import { getFloorRouteParams } from "@/lib/project-paths";
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
import { formatConcreteVolume } from "@/lib/utils/format";

type FloorRow = {
  actualConcreteTotal: number;
  buildingId: string;
  displayOrder: number;
  estimatedConcreteTotal: number;
  floorType: "foundation" | "ground" | "standard" | "basement" | "roof" | "other";
  id: string;
  levelNumber: number | null;
  name: string;
  pourTypeCount: number;
  projectId: string;
  slug?: string | null;
  remainingConcrete: number;
};

export function FloorsTable({
  building,
  floors,
  onMutationComplete,
  project,
}: {
  building: {
    id: string;
    slug?: string | null;
  };
  floors: FloorRow[];
  onMutationComplete: () => Promise<void> | void;
  project: {
    id: string;
    slug?: string | null;
  };
}) {
  return (
    <Card className="rounded-[28px] border-border/80 bg-card/90 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Floors</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveTableLayout
          desktop={
            <div className="desktop-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Floor</TableHead>
                    <TableHead className="whitespace-nowrap">Type</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Level</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Pour Types</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Estimated</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Actual</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Remaining</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {floors.length > 0 ? (
                    floors.map((floor) => (
                      <TableRow key={floor.id}>
                        <TableCell className="font-medium">
                          <PendingLink
                            className="hover:underline"
                            preload="intent"
                            to="/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier/floors/$floorIdentifier"
                            params={getFloorRouteParams(project, building, floor)}
                          >
                            {floor.name}
                          </PendingLink>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {floor.floorType.replaceAll("_", " ")}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          {floor.levelNumber ?? "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          {floor.pourTypeCount}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          {formatConcreteVolume(floor.estimatedConcreteTotal)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          {formatConcreteVolume(floor.actualConcreteTotal)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          {formatConcreteVolume(floor.remainingConcrete)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            <Button asChild size="sm" variant="outline">
                              <PendingLink
                                preload="intent"
                                to="/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier/floors/$floorIdentifier"
                                params={getFloorRouteParams(project, building, floor)}
                              >
                                View
                              </PendingLink>
                            </Button>
                            <EditFloorDialog
                              floor={floor}
                              onUpdated={async () => {
                                await onMutationComplete();
                              }}
                              trigger={
                                <Button size="sm" variant="outline">
                                  Edit
                                </Button>
                              }
                            />
                            <DeleteFloorDialog
                              floor={floor}
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
                      <TableCell className="h-24 text-center" colSpan={8}>
                        No floors yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          }
          mobile={
            <MobileCardList>
              {floors.length > 0 ? (
                floors.map((floor) => (
                  <MobileCard key={floor.id}>
                    <MobileCardHeader
                      title={floor.name}
                      subtitle={floor.floorType.replaceAll("_", " ")}
                    />
                    <MobileMetricGrid>
                      <MobileMetric label="Level" value={floor.levelNumber ?? "—"} />
                      <MobileMetric label="Pour Types" value={floor.pourTypeCount} />
                      <MobileMetric
                        label="Estimated"
                        value={formatConcreteVolume(floor.estimatedConcreteTotal)}
                      />
                      <MobileMetric
                        label="Actual"
                        value={formatConcreteVolume(floor.actualConcreteTotal)}
                      />
                      <MobileMetric
                        label="Remaining"
                        value={formatConcreteVolume(floor.remainingConcrete)}
                      />
                    </MobileMetricGrid>
                    <MobileActionRow className="[&>*]:flex-1">
                      <Button asChild variant="outline">
                        <PendingLink
                          to="/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier/floors/$floorIdentifier"
                          preload="intent"
                          params={getFloorRouteParams(project, building, floor)}
                        >
                          View
                        </PendingLink>
                      </Button>
                      <EditFloorDialog
                        floor={floor}
                        onUpdated={async () => {
                          await onMutationComplete();
                        }}
                        trigger={<Button variant="outline">Edit</Button>}
                      />
                      <DeleteFloorDialog
                        floor={floor}
                        onDeleted={onMutationComplete}
                        trigger={<Button variant="destructive">Delete</Button>}
                      />
                    </MobileActionRow>
                  </MobileCard>
                ))
              ) : (
                <MobileCard>
                  <p className="text-sm text-muted-foreground">No floors yet.</p>
                </MobileCard>
              )}
            </MobileCardList>
          }
        />
      </CardContent>
    </Card>
  );
}
