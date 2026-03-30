import { useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
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

type ProjectRow = {
  id: string;
  name: string;
  address: string;
  dateStarted: string;
  estimatedCompletionDate: string;
  totalConcretePoured: number;
  estimatedTotalConcrete: number;
};

export function ProjectsTable({ projects }: { projects: ProjectRow[] }) {
  const navigate = useNavigate();

  return (
    <Card className="rounded-[28px] border-border/80 bg-card/90 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Project production snapshot</CardTitle>
      </CardHeader>
      <CardContent>
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
                  onClick={() =>
                    navigate({
                      to: "/dashboard/projects/$projectId",
                      params: { projectId: project.id },
                    })
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      void navigate({
                        to: "/dashboard/projects/$projectId",
                        params: { projectId: project.id },
                      });
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
      </CardContent>
    </Card>
  );
}
