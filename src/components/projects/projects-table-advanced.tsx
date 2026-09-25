import { useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, ArrowUp, ChevronsUpDown } from "lucide-react";
import { acknowledgeNavigation } from "@/components/navigation/navigation-pending-indicator";
import { PendingLink } from "@/components/navigation/pending-link";
import { getProjectRouteParams } from "@/lib/project-paths";
import { cn } from "@/lib/utils";
import type { ProjectListQuery } from "@/lib/validation/project-list";
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

type ProjectSortBy = ProjectListQuery["sortBy"];
type ProjectSortDir = ProjectListQuery["sortDir"];

type ProjectRow = {
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
};

export function ProjectsTableAdvanced({
  onSortChange,
  projects,
  sortBy,
  sortDir,
}: {
  onSortChange: (sortBy: ProjectSortBy) => void;
  projects: ProjectRow[];
  sortBy: ProjectSortBy;
  sortDir: ProjectSortDir;
}) {
  const navigate = useNavigate();
  const router = useRouter();

  const navigateToProject = (project: ProjectRow) => {
    const params = getProjectRouteParams(project);

    acknowledgeNavigation({
      href: `/dashboard/projects/${params.projectIdentifier}`,
    });

    void navigate({
      to: "/dashboard/projects/$projectIdentifier",
      params,
    });
  };

  const preloadProject = (project: ProjectRow) => {
    void router.preloadRoute({
      to: "/dashboard/projects/$projectIdentifier",
      params: getProjectRouteParams(project),
    });
  };

  return (
    <Card className="rounded-[28px] border-border/70 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Project Management List</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveTableLayout
          desktop={
            <div className="desktop-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead
                      column="name"
                      label="Project"
                      onSortChange={onSortChange}
                      sortBy={sortBy}
                      sortDir={sortDir}
                    />
                    <SortableTableHead
                      column="status"
                      label="Status"
                      onSortChange={onSortChange}
                      sortBy={sortBy}
                      sortDir={sortDir}
                    />
                    <SortableTableHead
                      className="whitespace-nowrap"
                      column="dateStarted"
                      label="Start"
                      onSortChange={onSortChange}
                      sortBy={sortBy}
                      sortDir={sortDir}
                    />
                    <SortableTableHead
                      className="whitespace-nowrap"
                      column="estimatedCompletionDate"
                      label="Estimated Finish"
                      onSortChange={onSortChange}
                      sortBy={sortBy}
                      sortDir={sortDir}
                    />
                    <SortableTableHead
                      className="whitespace-nowrap text-right"
                      column="totalConcretePoured"
                      label="Poured"
                      onSortChange={onSortChange}
                      sortBy={sortBy}
                      sortDir={sortDir}
                    />
                    <SortableTableHead
                      className="whitespace-nowrap text-right"
                      column="estimatedTotalConcrete"
                      label="Estimated"
                      onSortChange={onSortChange}
                      sortBy={sortBy}
                      sortDir={sortDir}
                    />
                    <SortableTableHead
                      className="whitespace-nowrap"
                      column="lastPourDate"
                      label="Last Pour"
                      onSortChange={onSortChange}
                      sortBy={sortBy}
                      sortDir={sortDir}
                    />
                    <TableHead className="whitespace-nowrap text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow
                      key={project.id}
                      className="cursor-pointer hover:bg-muted/30"
                      title={`Open ${project.name}`}
                      onClick={() => navigateToProject(project)}
                      onMouseEnter={() => preloadProject(project)}
                    >
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
                      <TableCell className="whitespace-nowrap">
                        {formatDate(project.dateStarted)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(project.estimatedCompletionDate)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        {formatConcreteVolume(project.totalConcretePoured)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        {formatConcreteVolume(project.estimatedTotalConcrete)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {project.lastPourDate ? formatDate(project.lastPourDate) : "No pours"}
                      </TableCell>
                      <TableCell
                        className="whitespace-nowrap text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
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

function SortableTableHead({
  className,
  column,
  label,
  onSortChange,
  sortBy,
  sortDir,
}: {
  className?: string;
  column: ProjectSortBy;
  label: string;
  onSortChange: (sortBy: ProjectSortBy) => void;
  sortBy: ProjectSortBy;
  sortDir: ProjectSortDir;
}) {
  const isActive = sortBy === column;
  const SortIcon = !isActive ? ChevronsUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead
      className={className}
      aria-sort={isActive ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        className="inline-flex items-center gap-1 font-medium hover:text-primary"
        onClick={() => onSortChange(column)}
      >
        <span>{label}</span>
        <SortIcon
          className={cn("size-3.5", isActive ? "text-primary" : "text-muted-foreground")}
        />
      </button>
    </TableHead>
  );
}
