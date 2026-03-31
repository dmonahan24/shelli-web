import { EditBuildingDialog } from "@/components/buildings/edit-building-dialog";
import { DeleteBuildingDialog } from "@/components/buildings/delete-building-dialog";
import { PendingLink } from "@/components/navigation/pending-link";
import { getBuildingRouteParams } from "@/lib/project-paths";
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
  slug?: string | null;
  remainingConcrete: number;
};

export function BuildingsTable({
  buildings,
  onMutationComplete,
  project,
}: {
  buildings: BuildingRow[];
  onMutationComplete: () => Promise<void> | void;
  project: {
    id: string;
    slug?: string | null;
  };
}) {
  return (
    <Card className="rounded-[28px] border-border/80 bg-card/90 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Buildings</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveTableLayout
          desktop={
            <div className="desktop-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Building</TableHead>
                    <TableHead className="whitespace-nowrap">Code</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Floors</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Estimated</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Actual</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Remaining</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buildings.length > 0 ? (
                    buildings.map((building) => (
                      <TableRow key={building.id}>
                        <TableCell className="font-medium">
                          <PendingLink
                            className="hover:underline"
                        preload="intent"
                            to="/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier"
                            params={getBuildingRouteParams(project, building)}
                          >
                            {building.name}
                          </PendingLink>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{building.code ?? "—"}</TableCell>
                        <TableCell className="whitespace-nowrap text-right">{building.floorCount}</TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          {formatConcreteVolume(building.estimatedConcreteTotal)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          {formatConcreteVolume(building.actualConcreteTotal)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          {formatConcreteVolume(building.remainingConcrete)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            <Button asChild size="sm" variant="outline">
                              <PendingLink
                                preload="intent"
                                to="/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier"
                                params={getBuildingRouteParams(project, building)}
                              >
                                View
                              </PendingLink>
                            </Button>
                            <EditBuildingDialog
                              building={building}
                              onUpdated={async () => {
                                await onMutationComplete();
                              }}
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
          }
          mobile={
            <MobileCardList>
              {buildings.length > 0 ? (
                buildings.map((building) => (
                  <MobileCard key={building.id}>
                    <MobileCardHeader
                      title={building.name}
                      subtitle={building.code ?? "No building code"}
                    />
                    <MobileMetricGrid>
                      <MobileMetric label="Floors" value={building.floorCount} />
                      <MobileMetric
                        label="Estimated"
                        value={formatConcreteVolume(building.estimatedConcreteTotal)}
                      />
                      <MobileMetric
                        label="Actual"
                        value={formatConcreteVolume(building.actualConcreteTotal)}
                      />
                      <MobileMetric
                        label="Remaining"
                        value={formatConcreteVolume(building.remainingConcrete)}
                      />
                    </MobileMetricGrid>
                    <MobileActionRow className="[&>*]:flex-1">
                      <Button asChild variant="outline">
                        <PendingLink
                          to="/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier"
                          preload="intent"
                          params={getBuildingRouteParams(project, building)}
                        >
                          View
                        </PendingLink>
                      </Button>
                      <EditBuildingDialog
                        building={building}
                        onUpdated={async () => {
                          await onMutationComplete();
                        }}
                        trigger={
                          <Button variant="outline">
                            Edit
                          </Button>
                        }
                      />
                      <DeleteBuildingDialog
                        building={building}
                        onDeleted={onMutationComplete}
                        trigger={<Button variant="destructive">Delete</Button>}
                      />
                    </MobileActionRow>
                  </MobileCard>
                ))
              ) : (
                <MobileCard>
                  <p className="text-sm text-muted-foreground">No buildings yet.</p>
                </MobileCard>
              )}
            </MobileCardList>
          }
        />
      </CardContent>
    </Card>
  );
}
