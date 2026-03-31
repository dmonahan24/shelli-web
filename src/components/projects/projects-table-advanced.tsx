import { ArrowRight } from "lucide-react";
import { PendingLink } from "@/components/navigation/pending-link";
import { getProjectRouteParams } from "@/lib/project-paths";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatConcreteVolume, formatDate } from "@/lib/utils/format";

export function ProjectsTableAdvanced({
  projects,
}: {
  projects: Array<{
    address: string;
    dateStarted: string;
    estimatedCompletionDate: string;
    estimatedTotalConcrete: number;
    id: string;
    lastPourDate: string | null;
    name: string;
    projectCode: string | null;
    slug?: string | null;
    status: string;
    totalConcretePoured: number;
  }>;
}) {
  return (
    <Card className="rounded-[28px] border-border/70 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Project Management List</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-2xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>Estimated Finish</TableHead>
                <TableHead className="text-right">Poured</TableHead>
                <TableHead className="text-right">Estimated</TableHead>
                <TableHead>Last Pour</TableHead>
                <TableHead className="text-right">Open</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.address}</p>
                      {project.projectCode ? (
                        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                          {project.projectCode}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ProjectStatusBadge status={project.status} />
                  </TableCell>
                  <TableCell>{formatDate(project.dateStarted)}</TableCell>
                  <TableCell>{formatDate(project.estimatedCompletionDate)}</TableCell>
                  <TableCell className="text-right">
                    {formatConcreteVolume(project.totalConcretePoured)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatConcreteVolume(project.estimatedTotalConcrete)}
                  </TableCell>
                  <TableCell>
                    {project.lastPourDate ? formatDate(project.lastPourDate) : "No pours"}
                  </TableCell>
                  <TableCell className="text-right">
                    <PendingLink
                      to="/dashboard/projects/$projectIdentifier"
                      preload="viewport"
                      params={getProjectRouteParams(project)}
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary"
                    >
                      View <ArrowRight className="size-4" />
                    </PendingLink>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
