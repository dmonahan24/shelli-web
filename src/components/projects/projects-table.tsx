import { useNavigate, useRouter } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { acknowledgeNavigation } from "@/components/navigation/navigation-pending-indicator";
import { getProjectRouteParams } from "@/lib/project-paths";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
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

type ProjectRow = {
  id: string;
  slug?: string | null;
  name: string;
  address: string;
  dateStarted: string;
  estimatedCompletionDate: string;
  totalConcretePoured: number;
  estimatedTotalConcrete: number;
};

export function ProjectsTable({ projects }: { projects: ProjectRow[] }) {
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
    <Card className="rounded-[28px] border-border/80 bg-card/90 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Project production snapshot</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveTableLayout
          desktop={
            <div className="overflow-hidden rounded-2xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Project Address</TableHead>
                    <TableHead>Date Started</TableHead>
                    <TableHead>Estimated Completion Date</TableHead>
                    <TableHead className="text-right">Total Concrete Poured</TableHead>
                    <TableHead className="text-right">Estimated Total Concrete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow
                      key={project.id}
                      className="cursor-pointer transition-colors hover:bg-muted/40"
                      title={`Open ${project.name}`}
                      role="link"
                      tabIndex={0}
                      onClick={() => navigateToProject(project)}
                      onFocus={() => preloadProject(project)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigateToProject(project);
                        }
                      }}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center justify-between gap-2">
                          <span>{project.name}</span>
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell>{project.address}</TableCell>
                      <TableCell>{formatDate(project.dateStarted)}</TableCell>
                      <TableCell>{formatDate(project.estimatedCompletionDate)}</TableCell>
                      <TableCell className="text-right">
                        {formatConcreteVolume(project.totalConcretePoured)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatConcreteVolume(project.estimatedTotalConcrete)}
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
                <button
                  key={project.id}
                  type="button"
                  className="w-full text-left"
                  onClick={() => navigateToProject(project)}
                >
                  <MobileCard className="transition-colors hover:bg-muted/20">
                    <MobileCardHeader
                      title={project.name}
                      subtitle={project.address}
                      badge={<ChevronRight className="size-4 text-muted-foreground" />}
                    />
                    <MobileMetricGrid>
                      <MobileMetric label="Started" value={formatDate(project.dateStarted)} />
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
                  </MobileCard>
                </button>
              ))}
            </MobileCardList>
          }
        />
      </CardContent>
    </Card>
  );
}
