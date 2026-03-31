import { AddBuildingDialog } from "@/components/buildings/add-building-dialog";
import { BuildingsTable } from "@/components/hierarchy/buildings-table";
import { PendingLink } from "@/components/navigation/pending-link";
import { getProjectRouteParams } from "@/lib/project-paths";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BuildingRow = Parameters<typeof BuildingsTable>[0]["buildings"][number];

export function ProjectBuildingsSection({
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Buildings Overview</h2>
          <p className="text-sm text-muted-foreground">
            Manage the structural hierarchy for this project.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <PendingLink
              to="/dashboard/projects/$projectIdentifier/buildings"
              preload="intent"
              params={getProjectRouteParams(project)}
            >
              Manage Buildings
            </PendingLink>
          </Button>
          <AddBuildingDialog
            onCreated={onMutationComplete}
            projectId={project.id}
            trigger={<Button>Add Building</Button>}
          />
        </div>
      </div>
      {buildings.length > 0 ? (
        <BuildingsTable buildings={buildings} onMutationComplete={onMutationComplete} project={project} />
      ) : (
        <Card className="rounded-[28px] border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>No buildings yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Add the first building to start organizing floors and pour types inside this project.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
