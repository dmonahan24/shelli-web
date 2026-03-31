import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PendingLink } from "@/components/navigation/pending-link";
import { getProjectRouteParams } from "@/lib/project-paths";

export function ProjectBreadcrumbs({
  project,
}: {
  project: {
    id: string;
    slug?: string | null;
    name: string;
  };
}) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <PendingLink to="/dashboard" preload="intent">Dashboard</PendingLink>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <PendingLink to="/dashboard/projects" preload="intent">Projects</PendingLink>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <PendingLink
              to="/dashboard/projects/$projectIdentifier"
              preload="intent"
              params={getProjectRouteParams(project)}
            >
              {project.name}
            </PendingLink>
          </BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
