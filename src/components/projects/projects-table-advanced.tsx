import { ArrowRight } from "lucide-react";
import { PendingLink } from "@/components/navigation/pending-link";
import { getProjectRouteParams } from "@/lib/project-paths";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
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
import { Button } from "@/components/ui/button";
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
        <ResponsiveTableLayout
          desktop={
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
                      preload="intent"
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
          }
          mobile={
            <MobileCardList>
              {projects.map((project) => (
                <MobileCard key={project.id}>
                  <MobileCardHeader
                    title={project.name}
                    subtitle={project.address}
                    badge={<ProjectStatusBadge status={project.status} />}
                  />
                  {project.projectCode ? (
                    <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                      {project.projectCode}
                    </p>
                  ) : null}
                  <MobileMetricGrid>
                    <MobileMetric label="Start" value={formatDate(project.dateStarted)} />
                    <MobileMetric
                      label="Finish"
                      value={formatDate(project.estimatedCompletionDate)}
                    />
                    <MobileMetric
                      label="Poured"
                      value={formatConcreteVolume(project.totalConcretePoured)}
                    />
                    <MobileMetric
                      label="Estimated"
                      value={formatConcreteVolume(project.estimatedTotalConcrete)}
                    />
                  </MobileMetricGrid>
                  <MobileMetric
                    label="Last Pour"
                    value={project.lastPourDate ? formatDate(project.lastPourDate) : "No pours"}
                  />
                  <MobileActionRow>
                    <Button asChild className="flex-1">
                      <PendingLink
                        to="/dashboard/projects/$projectIdentifier"
                        preload="intent"
                        params={getProjectRouteParams(project)}
                      >
                        View Project
                      </PendingLink>
                    </Button>
                  </MobileActionRow>
                </MobileCard>
              ))}
            </MobileCardList>
          }
        />
      </CardContent>
    </Card>
  );
}
